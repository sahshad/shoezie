require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const pdf = require("html-pdf");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const ejs = require("ejs");
const mongoose = require("mongoose");
const Order = require("../model/order");
const Product = require("../model/product");
const Cart = require("../model/cart");
const Wallet = require("../model/wallet");
const Coupon = require("../model/coupon");
const User = require("../model/user");
const { StatusCodes } = require("http-status-codes");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

async function createRazorpayOrder(amount) {
  try {
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${new Date().getTime()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create Razorpay order");
  }
}

async function createOrder(req, res) {
  const userId = req.session.user;
  const { items, shippingAddress, totalAmount, paymentMethod, couponCode, couponDiscount, offerDiscount } = req.body;

  try {
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Product not found` });
      }

      const variant = product.sizes.find((size) => size._id.toString() === item.sizeId);
      if (!variant) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Size not found` });
      }

      if (variant.stock < item.quantity) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: `Not enough stock for ${product.name}` });
      }
    }

    let newOrder;

    if (paymentMethod === "razorpay") {
      if (couponCode) {
        req.session.coupon = couponCode;
      }
      newOrder = new Order({
        userId,
        items,
        shippingAddress,
        totalAmount,
        couponDiscount: couponDiscount || 0,
        offerDiscount: offerDiscount || 0,
        paymentMethod,
        paymentStatus: "failed",
      });

      const savedOrder = await newOrder.save();
      return res.status(StatusCodes.CREATED).json(savedOrder);
    } else if (paymentMethod === "cod" || paymentMethod === "wallet") {
      if (paymentMethod === "wallet") {
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Wallet not found" });
        }

        if (totalAmount > wallet.balance) {
          return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "insufficient balance" });
        }
        wallet.balance -= totalAmount;

        wallet.transactions.push({ amount: totalAmount, type: "debit", date: new Date() });

        await wallet.save();

        newOrder = new Order({
          userId,
          items,
          shippingAddress,
          totalAmount,
          couponDiscount: couponDiscount || 0,
          offerDiscount: offerDiscount || 0,
          paymentMethod,
          paymentStatus: "Paid",
        });
      } else {
        newOrder = new Order({
          userId,
          items,
          shippingAddress,
          totalAmount,
          couponDiscount: couponDiscount || 0,
          offerDiscount: offerDiscount || 0,
          paymentMethod,
          paymentStatus: "Pending",
        });
      }
    }

    for (const item of items) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, "sizes._id": item.sizeId },
        { $inc: { "sizes.$.stock": -item.quantity } }
      );
    }

    await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } }, { new: true });

    if (couponCode) {
      const updatedCoupon = await Coupon.findOneAndUpdate(
        { code: couponCode },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      const coupon = await Coupon.findOne({ code: couponCode });

      const user = await User.findById(userId);

      if (!user.usedCoupons) {
        user.usedCoupons = [];
      }

      user.usedCoupons.push(coupon._id);
      await user.save();

      if (!updatedCoupon) {
        console.log("Coupon not found or already used limit reached.");
        return;
      }
    }

    const savedOrder = await newOrder.save();
    res.status(StatusCodes.CREATED).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to create order." });
  }
}

async function updateOrderStatus(req, res) {
  const userId = req.session.user;
  const { orderId } = req.params;
  const { status, razorpayResponse, repay } = req.body;
  let orderStatus;

  if (req.session.coupon) {
    const couponCode = req.session.coupon;
    delete req.session.coupon;
    const updatedCoupon = await Coupon.findOneAndUpdate(
      { code: couponCode },
      { $inc: { usedCount: 1 } },
      { new: true }
    );
    const coupon = await Coupon.findOne({ code: couponCode });

    const user = await User.findById(userId);

    if (!user.usedCoupons) {
      user.usedCoupons = [];
    }

    user.usedCoupons.push(coupon._id);
    await user.save();

    if (!updatedCoupon) {
      console.log("Coupon not found or already used limit reached.");
      return;
    }
  }

  if (status === "Paid") {
    orderStatus = "Pending";
    if (!repay) {
      await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } }, { new: true });
    }

    const order = await Order.findById(orderId);
    const items = order.items;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error("Product not found");

      const variant = product.sizes.find((size) => size._id.toString() === item.sizeId.toString());
      if (!variant) throw new Error("Size not found");

      if (variant.stock < item.quantity) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
      }
    }

    for (const item of items) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, "sizes._id": item.sizeId },
        { $inc: { "sizes.$.stock": -item.quantity } }
      );
    }
  } else {
    orderStatus = "Failed";

    if (!repay) {
      await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } }, { new: true });
    }
  }

  try {
    const update = {
      paymentStatus: status,
      orderStatus,
      ...(razorpayResponse && {
        paymentId: razorpayResponse.razorpay_payment_id,
        orderId: razorpayResponse.razorpay_order_id,
        signature: razorpayResponse.razorpay_signature,
      }),
    };

    await Order.findByIdAndUpdate(orderId, update);
    if (status === "Paid") {
      res.status(StatusCodes.OK).json({ success: true, message: `Order created successfully!` });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: `Payment failed !` });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to update order status." });
  }
}

async function getAllOrders(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalOrders = await Order.countDocuments({});
    const orders = await Order.find({})
      .populate("userId")
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalOrders / limit);

    res.render("admin/ordersList", {
      orders,
      currentPage: page,
      totalPages,
      limit,
      totalOrders,
      activePage: "orders",
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
}

async function cancelOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId).populate("userId").populate("items.productId");

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Order not found" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Order already cancelled" });
    }

    if (order.paymentStatus === "Paid") {
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({ userId: order.userId });
        await wallet.save();
      }
      const totalAmount = parseFloat(order.totalAmount);
      console.log(totalAmount);

      wallet.balance += totalAmount;
      wallet.transactions.push({ amount: totalAmount, type: "credit" });
      await wallet.save();
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId._id);
      if (product) {
        const variant = product.sizes.find((size) => size._id.toString() === item.sizeId.toString());
        if (variant) {
          variant.stock += item.quantity;
          await product.save();
        } else {
          console.error(`Size variant ${item.size} not found for product ${item.productId}`);
        }
      } else {
        console.error(`Product not found: ${item.productId}`);
      }
    }

    order.orderStatus = "Cancelled";
    const updatedOrder = await order.save();

    res.status(StatusCodes.OK).json({ message: "Order cancelled successfully", order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error", error });
  }
}

async function changeOrderStatus(req, res) {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  try {
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid order status" });
    }
    if (orderStatus === "Delivered") {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus, paymentStatus: "Paid" },
        { new: true }
      );
      return res.status(StatusCodes.OK).json({ message: "Order status updated successfully", order: updatedOrder });
    }
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true });

    if (!updatedOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Order not found" });
    }

    return res.status(StatusCodes.OK).json({ message: "Order status updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

async function viewOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId).populate("items.productId").populate("items.offerId");

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Order not found" });
    }

    res.render("admin/orderView", { order });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error", error: error.message });
  }
}

async function ordercreated(req, res) {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).populate("userId").populate("items.productId");
  res.render("user/orderCompleted", { order });
}

async function returnOrder(req, res) {
  const { orderId } = req.params;
  const { reason } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (order.return.reason) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Return request already submitted" });
    }

    order.return = {
      reason,
      status: "Pending",
      requestedAt: new Date(),
    };

    await order.save();

    res.status(StatusCodes.OK).json({ success: true, message: "Return request submitted successfully" });
  } catch (error) {
    console.error("Error processing return request:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
}

async function takeReturnAction(req, res) {
  const { orderId } = req.params;
  const { action } = req.body;

  try {
    const order = await Order.findById(orderId).populate("userId");

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (!order.return || order.return.status !== "Pending") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "No pending return request for this order" });
    }

    if (action === "approved") {
      for (const item of order.items) {
        const updateResult = await Product.updateOne(
          { _id: item.productId, "sizes._id": item.sizeId },
          { $inc: { "sizes.$.stock": item.quantity } }
        );

        if (updateResult.nModified === 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: `Failed to update stock for product ID ${item.productId} and size ID ${item.sizeId}`,
          });
        }
      }

      const wallet = await Wallet.findOne({ userId: order.userId._id });

      if (!wallet) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Wallet not found for this user" });
      }

      wallet.balance += order.totalAmount;
      wallet.transactions.push({
        amount: order.totalAmount,
        type: "credit",
      });
      await wallet.save();

      order.orderStatus = "Returned";
    }

    order.return.status = action === "approved" ? "Approved" : "Rejected";
    order.return.processedAt = new Date();
    await order.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Return has been ${action} successfully`,
    });
  } catch (error) {
    console.error("Error while processing return request:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
}

async function downloadInvoice(req, res) {
  try {
    const order = await Order.findById(req.params.orderId).populate("items.productId").populate("items.offerId");
    if (!order) return res.status(StatusCodes.NOT_FOUND).send("Order not found");

    const invoiceData = {
      invoiceId: order._id,
      orderDate: order.orderDate.toLocaleDateString(),
      customerName: order.shippingAddress.fullname,
      customerAddress: `${order.shippingAddress.address}`,
      items: order.items.map((item) => ({
        productName: item.productId.name,
        quantity: item.quantity,
        offerId: item.offerId ? item.offerId : null,
        price: item.price,
      })),
      totalAmount: order.items.reduce((total, item) => total + item.price * item.quantity, 0),
    };

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order._id}.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfData);
    });

    doc.fontSize(20).text("SHOEZIE", { align: "center" });
    doc.fontSize(14).text("Step into the world of comfort", { align: "center" });
    doc.text("Contact Us: shoezie47@gmail.com", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice #: ${invoiceData.invoiceId}`);
    doc.text(`Order Date: ${invoiceData.orderDate}`);
    doc.text(`Customer: ${invoiceData.customerName}`);
    doc.text(`Address: ${invoiceData.customerAddress}`);
    doc.moveDown();

    const tableTop = doc.y + 10;
    const itemX = 50,
      quantityX = 250,
      priceX = 350,
      totalX = 450;

    doc
      .fontSize(10)
      .text("Product", itemX, tableTop)
      .text("Quantity", quantityX, tableTop)
      .text("Price ", priceX, tableTop)
      .text("Total ", totalX, tableTop);

    doc
      .moveDown()
      .moveTo(itemX, doc.y)
      .lineTo(totalX + 50, doc.y)
      .stroke();

    let totalAmount = 0;
    let yPos = doc.y + 5;

    invoiceData.items.forEach((item) => {
      const price = item.offerId ? calculateDiscountedPrice(item) : item.price;
      const total = price * item.quantity;
      totalAmount += total;

      doc.text(item.productName, itemX, yPos);
      doc.text(item.quantity, quantityX, yPos);
      doc.text(` ${price.toFixed(2)}`, priceX, yPos);
      doc.text(` ${total.toFixed(2)}`, totalX, yPos);
      yPos += 20;
    });

    doc
      .moveDown(2)
      .fontSize(12)
      .text(`Total Amount: ₹${totalAmount.toFixed(2)}`, totalX, yPos + 10, { align: "right" });

    const footerYPosition = doc.page.height - 100;
    doc.fontSize(10).text("Thank you for your purchase!", 0, footerYPosition, { align: "center" });
    doc.text("Return Policy: You can return items within 7 days of receipt.", 0, footerYPosition + 15, {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Server error");
  }
}

function calculateDiscountedPrice(item) {
  if (!item.offerId) return item.price;

  let effectivePrice;
  if (item.offerId.offerType === "percentage") {
    const discount = Math.min((item.price * item.offerId.value) / 100, item.offerId.maxDiscount || Infinity);
    effectivePrice = item.price - discount;
  } else {
    effectivePrice = item.price - item.offerId.value;
  }

  return effectivePrice;
}

async function checkProduct(req, res) {
  const { orderId } = req.params;
  console.log(orderId);

  try {
    const order = await Order.findById(orderId);
    const items = order.items;
    console.log(order);
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "product not found" });
      }

      if (!product.status) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "product is currently unavailable" });
      }

      const variant = product.sizes.find((size) => size._id.toString() === item.sizeId.toString());
      if (!variant) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "variant not found" });
      }

      if (variant.stock < item.quantity) {
        console.log("false");
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
      }
    }

    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  cancelOrder,
  changeOrderStatus,
  viewOrder,
  createRazorpayOrder,
  updateOrderStatus,
  ordercreated,
  returnOrder,
  takeReturnAction,
  downloadInvoice,
  checkProduct,
};
