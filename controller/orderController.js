const mongoose = require('mongoose')
const Order = require('../model/order')
const Product = require('../model/product')
const Cart = require('../model/cart')


async function createOrder(req,res){
    const userId = req.session.user
    const { items, shippingAddress, totalAmount,paymentMethod } = req.body;
    try { 
        
        for( const item of items){
            const product = await Product.findById(item.productId)
            
            if(!product){
                throw new Error('Product not found')
            }
            
            const sizeId = item.sizeId
            const variant = product.sizes.find((size) =>{ 
                return size._id.toString() === sizeId 
            })
            console.log(variant._id);
            
            if(!variant){
                throw new Error('Size not found')
            }

            if(variant.stock < item.quantity){
                return res.status(400).json({ message: `Not enough stock for ${product.name}. Available stock: ${variant.stock}` });
            }
        }

        for (const item of items) {
            const productId = item.productId;
            const sizeId = item.sizeId;

            const updateResult = await Product.updateOne(
                { _id: productId, 'sizes._id': sizeId },  
                { $inc: { 'sizes.$.stock': -item.quantity } }
            );
        
        }
        
        const newOrder = new Order({
            userId, 
            items, 
            shippingAddress,
            totalAmount,
            paymentMethod 
        });
         await newOrder.save();

         const cartUpdateResult = await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { products: [] } },
            { new: true }
        );

        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to place order. Please try again.' });
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

async function cancelOrder(req,res){
    const {orderId} = req.params

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: 'Cancelled' },
            { new: true } 
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order cancelled successfully', order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
    const { orderId} = req.params; // Access orderId from req.body
    try {
        const order = await Order.findById(orderId).populate('items.productId')
  
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.render('admin/orderView', { order });
    } catch (error) {
        console.log(error);
        // Return an error response if something goes wrong
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

module.exports = {
    createOrder,getAllOrders,cancelOrder,changeOrderStatus,viewOrder
}