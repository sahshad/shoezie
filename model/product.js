const mongoose = require('mongoose');

const sizeStockSchema = new mongoose.Schema({
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 }, 
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    sizes: { type: [sizeStockSchema], required: true }, 
    imageUrls: { type: [String], required: true },
    status: { type: Boolean, default: true },
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
