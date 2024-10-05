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
        
            // Update the stock of the specified size
            const updateResult = await Product.updateOne(
                { _id: productId, 'sizes._id': sizeId },  // Use updateOne for array element update
                { $inc: { 'sizes.$.stock': -item.quantity } }
            );
        
        }
        

        const newOrder = new Order({
            userId, // This should be the logged-in user's ID
            items, // Array of products with productId, quantity, and price
            shippingAddress, // Full name, address, pincode, and phone
            totalAmount,
            paymentMethod // Calculated total amount of the order
        });
        // Save the order to the database
         await newOrder.save();

         const cartUpdateResult = await Cart.findOneAndUpdate(
            { user: userId }, // Use findOneAndUpdate instead of findByIdAndUpdate
            { $set: { products: [] } },
            { new: true }
        );
        // Respond with success
        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to place order. Please try again.' });
    }  
}

async function getAllOrders(rq,res){
    try {      
        const orders = await Order.find().populate('userId').populate('items.productId')
        if(!orders){
         
        }
        res.render('admin/ordersList',{orders})
    } catch (error) {
        
    }
}

async function cancelOrder(req,res){
    const {orderId} = req.params

    try {
        // Find the order by ID and update the status
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: 'Cancelled' },
            { new: true } // Return the updated document
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

module.exports = {
    createOrder,getAllOrders,cancelOrder
}