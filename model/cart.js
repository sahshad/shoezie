// models/Cart.js

const mongoose = require('mongoose');

const cartSchema= new mongoose.Schema({
user:{type:mongoose.Schema.Types.ObjectId, ref: 'User',required:true},
products: [{ 
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' ,require:true},
    sizeId:{type:mongoose.Schema.Types.ObjectId,require:true},
    quantity: { type: Number, default: 1 ,require:true},
 }]}, {
    timestamps: true,
});

module.exports = mongoose.model('Cart', cartSchema);
