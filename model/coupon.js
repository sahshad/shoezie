const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    discountAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discountType: {
        type: String,
        enum: ['flat', 'percentage'], // 'flat' for fixed amount, 'percentage' for % discount
        default: 'flat'
    },
    maxDiscount: {
        type: Number, // Optional: Max discount limit for percentage coupons
        default: 0
    },
    minOrderValue: {
        type: Number, // Optional: Minimum cart value required to apply the coupon
        default: 0
    },
    expiresAt: {
        type: Date, // Coupon expiry date
        required: true
    },
    usageLimit: {
        type: Number, // Optional: Max times a coupon can be used
        default: 1
    },
    usedCount: {
        type: Number, // Track how many times it has been used
        default: 0
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
