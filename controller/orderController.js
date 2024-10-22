require('dotenv').config();
const Razorpay = require('razorpay')
const crypto = require('crypto')
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

  // async function createOrder(req, res) {

  //   const userId = req.session.user;
  //   const { items, shippingAddress, totalAmount, paymentMethod,
  //      razorpayPaymentId, razorpayOrderId, razorpaySignature,
  //      couponCode,couponDiscount,offerDiscount } = req.body;

  //   try {
  //     for (const item of items) {
  //       const product = await Product.findById(item.productId);
  //       if (!product) throw new Error('Product not found');
  
  //       const variant = product.sizes.find(size => size._id.toString() === item.sizeId);
  //       if (!variant) throw new Error('Size not found');
  
  //       if (variant.stock < item.quantity) {
  //         return res.status(400).json({ message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
  //       }
  //     }
  
  //     for (const item of items) {
  //       const updateResult = await Product.updateOne(
  //         { _id: item.productId, 'sizes._id': item.sizeId },
  //         { $inc: { 'sizes.$.stock': -item.quantity } }
  //       );
  //     }
  
  //   //   // Handle Razorpay Payment Method
  //   //   if (paymentMethod === 'razorpay') {
  //   //     // Verify payment signature to prevent tampering
  //   //     const generatedSignature = crypto
  //   //       .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
  //   //       .update(razorpayOrderId + '|' + razorpayPaymentId)
  //   //       .digest('hex');
  
  //   //     if (generatedSignature !== razorpaySignature) {      
  //   //       return res.status(400).json({ message: 'Invalid payment signature' });
  //   //     }
  //   //   }
  
  //     const newOrder = new Order({
  //       userId,
  //       items,
  //       shippingAddress,
  //       totalAmount,
  //       couponDiscount : couponDiscount || 0,
  //       offerDiscount : offerDiscount || 0,
  //       paymentMethod,
  //       paymentStatus: paymentMethod === 'razorpay' ? 'Paid' : 'Pending',
  //     });
  //     await newOrder.save();
  
  //     await Cart.findOneAndUpdate(
  //       { user: userId },
  //       { $set: { products: [] } },
  //       { new: true }
  //     );

  //     if(couponCode){

  //      const updatedCoupon = await Coupon.findOneAndUpdate(
  //       { code: couponCode }, // Find coupon by code
  //       { $inc: { usedCount: 1 } }, // Increment usedCount by 1
  //       { new: true } // Return the updated document
  //     );

  //     if (!updatedCoupon) {
  //       console.log('Coupon not found or already used limit reached.');
  //       return;
  //     }
  //     }
  //     res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: 'Failed to place order. Please try again.' });
  //   }
  // }
  


// async function createOrder(req,res){
//     const userId = req.session.user
//     const { items, shippingAddress, totalAmount,paymentMethod } = req.body;
//     try { 
        
//         for( const item of items){
//             const product = await Product.findById(item.productId)
            
//             if(!product){
//                 throw new Error('Product not found')
//             }
            
//             const sizeId = item.sizeId
//             const variant = product.sizes.find((size) =>{ 
//                 return size._id.toString() === sizeId 
//             })
//             console.log(variant._id);
            
//             if(!variant){
//                 throw new Error('Size not found')
//             }

//             if(variant.stock < item.quantity){
//                 return res.status(400).json({ message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
//             }
//         }

//         for (const item of items) {
//             const productId = item.productId;
//             const sizeId = item.sizeId;

//             const updateResult = await Product.updateOne(
//                 { _id: productId, 'sizes._id': sizeId },  
//                 { $inc: { 'sizes.$.stock': -item.quantity } }
//             );
        
//         }
        
//         const newOrder = new Order({
//             userId, 
//             items, 
//             shippingAddress,
//             totalAmount,
//             paymentMethod 
//         });
//          await newOrder.save();

//          const cartUpdateResult = await Cart.findOneAndUpdate(
//             { user: userId },
//             { $set: { products: [] } },
//             { new: true }
//         );

//         res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Failed to place order. Please try again.' });
//     }  
// }



// Create Order Route

async function createOrder(req, res) {
  const userId = req.session.user;
  const { items, shippingAddress, totalAmount, paymentMethod,
     couponCode, couponDiscount, offerDiscount } = req.body;

  try {
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
              const product = await Product.findById(item.productId);
              if (!product) throw new Error('Product not found');
        
              const variant = product.sizes.find(size => size._id.toString() === item.sizeId);
              if (!variant) throw new Error('Size not found');
        
              if (variant.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
              }
            }
        
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

      if(couponCode){

       const updatedCoupon = await Coupon.findOneAndUpdate(
        { code: couponCode }, 
        { $inc: { usedCount: 1 } }, 
        { new: true } 
      );
      const coupon = await Coupon.findOne({code:couponCode})

      const user = await User.findById(userId)

      if(!user.usedCoupons){
        user.usedCoupons=[]
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
  const { orderId } = req.params;
  const { status, razorpayResponse } = req.body;

  try {
      const update = {
          paymentStatus: status,
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



async function getAllOrders(rq,res){
    try {      
const orders = await Order.find({}).populate('userId').populate('items.productId').sort({createdAt:-1})
        if(!orders){
         
        }
        res.render('admin/ordersList',{orders})
    } catch (error) {
        
    }
}

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
          wallet.transactions.push({ amount:totalAmount, type: 'credit' });
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
    if(orderStatus==='Delivered'){
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus,paymentStatus:'Paid'},
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

async function viewOrder(req,res) {
    const { orderId} = req.params; 
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

async function ordercreated(req,res) {
  res.render('user/orderCompleted')
}

module.exports = {
    createOrder,getAllOrders,cancelOrder,changeOrderStatus,viewOrder,
    createRazorpayOrder,updateOrderStatus,ordercreated
}