require('dotenv').config();
const Razorpay = require('razorpay')
const crypto = require('crypto')
const pdf = require('html-pdf');
const fs = require('fs');
const ejs = require('ejs');
const mongoose = require('mongoose')
const Order = require('../model/order')
const Product = require('../model/product')
const Cart = require('../model/cart')
const Wallet = require('../model/wallet')
const Coupon = require('../model/coupon')
const User = require('../model/user')


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

async function createRazorpayOrder(amount) {
  try {
    const options = {
      amount: amount * 100, // Convert to paisa
      currency: "INR",
      receipt: `receipt_${new Date().getTime()}`, // Unique receipt ID
      payment_capture: 1, // Auto capture payment (1: Yes, 0: No)
    };

    const order = await razorpayInstance.orders.create(options);
    return {
      id: order.id, // Order ID from Razorpay
      amount: order.amount, // Amount in paisa
      currency: order.currency, // Currency (INR)
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create Razorpay order');
  }
}

async function createOrder(req, res) {
  const userId = req.session.user;
  const { items, shippingAddress, totalAmount, paymentMethod,
    couponCode, couponDiscount, offerDiscount } = req.body;

  try {
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error('Product not found');

      const variant = product.sizes.find(size => size._id.toString() === item.sizeId);
      if (!variant) throw new Error('Size not found');

      if (variant.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
      }
    }

    if (paymentMethod === 'razorpay') {
      if(couponCode){
        req.session.coupon = couponCode
      }
      const newOrder = new Order({
        userId,
        items,
        shippingAddress,
        totalAmount,
        couponDiscount: couponDiscount || 0,
        offerDiscount: offerDiscount || 0,
        paymentMethod,
        paymentStatus: 'failed',
      })

      const savedOrder = await newOrder.save();
      return res.status(201).json(savedOrder);
    }

    const newOrder = new Order({
      userId,
      items,
      shippingAddress,
      totalAmount,
      couponDiscount: couponDiscount || 0,
      offerDiscount: offerDiscount || 0,
      paymentMethod,
      paymentStatus: 'Pending',
    });


    for (const item of items) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, 'sizes._id': item.sizeId },
        { $inc: { 'sizes.$.stock': -item.quantity } }
      );
    }

    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );

    if (couponCode) {

      const updatedCoupon = await Coupon.findOneAndUpdate(
        { code: couponCode },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      const coupon = await Coupon.findOne({ code: couponCode })

      const user = await User.findById(userId)

      if (!user.usedCoupons) {
        user.usedCoupons = []
      }

      user.usedCoupons.push(coupon._id)
      await user.save()

      if (!updatedCoupon) {
        console.log('Coupon not found or already used limit reached.');
        return;
      }
    }

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order.' });
  }
}

async function updateOrderStatus(req, res) {
  const userId = req.session.user
  const { orderId } = req.params;
  const { status, razorpayResponse,repay } = req.body;
  let orderStatus
  
  if (req.session.coupon) {
    const couponCode = req.session.coupon
    delete req.session.coupon
    const updatedCoupon = await Coupon.findOneAndUpdate(
      { code: couponCode },
      { $inc: { usedCount: 1 } },
      { new: true }
    );
    const coupon = await Coupon.findOne({ code: couponCode })

    const user = await User.findById(userId)

    if (!user.usedCoupons) {
      user.usedCoupons = []
    }

    user.usedCoupons.push(coupon._id)
    await user.save()

    if (!updatedCoupon) {
      console.log('Coupon not found or already used limit reached.');
      return;
    }
  }

  if (status === 'Paid') {
    orderStatus = 'Pending'
  if(!repay){
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );
  }

    const order = await Order.findById(orderId)
    const items = order.items

    for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error('Product not found');
      
            const variant = product.sizes.find(size => size._id.toString() === item.sizeId.toString());
            if (!variant) throw new Error('Size not found');
      
            if (variant.stock < item.quantity) {
              return res.status(400).json({ success:false, message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
            }
          }

    for (const item of items) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, 'sizes._id': item.sizeId },
        { $inc: { 'sizes.$.stock': -item.quantity } }
      );
    }
  } else {
    orderStatus = 'Failed'

     if(!repay){
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );
  }
  }

  try {
    const update = {
      paymentStatus: status,
      orderStatus,
      ...(razorpayResponse && {
        paymentId: razorpayResponse.razorpay_payment_id,
        orderId: razorpayResponse.razorpay_order_id,
        signature: razorpayResponse.razorpay_signature
      })
    };

    await Order.findByIdAndUpdate(orderId, update);
    res.status(200).json({ message: `Order ${status} successfully!` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status.' });
  }
}

async function getAllOrders(rq, res) {
  try {
    const orders = await Order.find({}).populate('userId').populate('items.productId').sort({ createdAt: -1 })
    if (!orders) {

    }
    res.render('admin/ordersList', { orders , currentPage:'orders' })
  } catch (error) {

  }
}

// async function getAllOrders(rq, res) {
//   try {
//     const page = parseInt(rq.query.page) || 1;
//     const limit = parseInt(rq.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const orders = await Order.find({})
//       .populate('userId')
//       .populate('items.productId')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const totalOrders = await Order.countDocuments({});
//     const totalPages = Math.ceil(totalOrders / limit);

//     res.render('admin/ordersList', { orders, currentPage: page, totalPages, limit });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// }

async function cancelOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId).populate('userId').populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order already cancelled' });
    }

    if (order.paymentStatus === 'Paid') {
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({ userId: order.userId });
        await wallet.save();
      }
      const totalAmount = parseFloat(order.totalAmount);
      console.log(totalAmount);

      wallet.balance += totalAmount;
      wallet.transactions.push({ amount: totalAmount, type: 'credit' });
      await wallet.save();
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId._id);
      if (product) {
        const variant = product.sizes.find(size => size._id.toString() === item.sizeId.toString());
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

    order.orderStatus = 'Cancelled';
    const updatedOrder = await order.save();

    res.status(200).json({ message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
}

async function changeOrderStatus(req, res) {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  try {
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    if (orderStatus === 'Delivered') {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus, paymentStatus: 'Paid' },
        { new: true }
      )
      return res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function viewOrder(req, res) {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId).populate('items.productId')

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.render('admin/orderView', { order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

async function ordercreated(req, res) {
  const {orderId} = req.params
  const order = await Order.findById(orderId).populate('userId').populate('items.productId')
  res.render('user/orderCompleted',{order})
}

async function returnOrder (req, res){
  const { orderId } = req.params;
  const { reason } = req.body;

  try {
      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.return.reason) {
          return res.status(400).json({ success: false, message: 'Return request already submitted' });
      }

      order.return = {
          reason,
          status: 'Pending', 
          requestedAt: new Date(),
      };

      await order.save();

      res.status(200).json({ success: true, message: 'Return request submitted successfully' });
  } catch (error) {
      console.error('Error processing return request:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function takeReturnAction(req,res){
  const { orderId } = req.params;
  const { action } = req.body;

  try {
      const order = await Order.findById(orderId).populate('userId');

      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (!order.return || order.return.status !== 'Pending') {
          return res.status(400).json({ success: false, message: 'No pending return request for this order' });
      }

      if (action === 'approved') {
          for (const item of order.items) {
              const updateResult = await Product.updateOne(
                  { _id: item.productId, 'sizes._id': item.sizeId },
                  { $inc: { 'sizes.$.stock': item.quantity } }
              );

              if (updateResult.nModified === 0) {
                  return res.status(400).json({
                      success: false,
                      message: `Failed to update stock for product ID ${item.productId} and size ID ${item.sizeId}`,
                  });
              }
          }

          const wallet = await Wallet.findOne({ userId: order.userId._id });

          if (!wallet) {
              return res.status(404).json({ success: false, message: 'Wallet not found for this user' });
          }

          wallet.balance += order.totalAmount;
          wallet.transactions.push({
              amount: order.totalAmount,
              type: 'credit',
          });
          await wallet.save();
          
          order.orderStatus = 'Returned'
      }

      order.return.status = action === 'approved' ? 'Approved' : 'Rejected';
      order.return.processedAt = new Date();
      await order.save();

      return res.status(200).json({
          success: true,
          message: `Return has been ${action} successfully`,
      });

  } catch (error) {
      console.error('Error while processing return request:', error);
      return res.status(500).json({
          success: false,
          message: 'Internal server error. Please try again later.',
      });
  }

}

async function downloadInvoice(req,res) {

  try {
    const order = await Order.findById(req.params.orderId).populate('items.productId');
    if (!order) return res.status(404).send('Order not found');

    const invoiceData = {
        invoiceId: order._id,
        orderDate: order.orderDate.toLocaleDateString(),
        customerName: order.shippingAddress.fullname,
        customerAddress: `${order.shippingAddress.address}`,
        items: order.items.map(item => ({
            productName: item.productId.name,
            quantity: item.quantity,
            price: item.price
        })),
        totalAmount: order.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    };

    ejs.renderFile('views/user/invoice/invoice-template.ejs', invoiceData, (err, html) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error generating PDF');
        }

        const options = { format: 'A4' };
        pdf.create(html, options).toBuffer((err, buffer) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error generating PDF');
            }

            res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(buffer);
        });
    });
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
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
  downloadInvoice
}