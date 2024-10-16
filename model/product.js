const mongoose = require('mongoose');

const sizeStockSchema = new mongoose.Schema({
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 }, // Ensure stock is a non-negative number
});

// const offerDetailsSchema = new mongoose.Schema({
//     offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
//     offerType: { type: String, enum: ['percentage', 'flat'], required: true },
//     discountAmount: { type: Number, required: true }, // Discount amount calculated
//     offerPrice: { type: Number, required: true }, // Final price after discount
//     expiresAt: { type: Date, required: true },
// });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    sizes: { type: [sizeStockSchema], required: true }, // Use the size-stock subdocument
    imageUrls: { type: [String], required: true },
    status: { type: Boolean, default: true },
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
