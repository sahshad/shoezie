const mongoose =require('mongoose')

const offerDetailsSchema = new mongoose.Schema({
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    offerType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountAmount: { type: Number, required: true }, // Precomputed discount amount
    expiresAt: { type: Date, required: true },
});

const categorySchema = new mongoose.Schema({
  name:{type:String,required:true,unique:true},
  imageUrl:{type:String,required:true},
  status: { type: Boolean, default: true },
  categoryOfferDetails: offerDetailsSchema, 
},
{timestamps:true})

module.exports = mongoose.model('Category',categorySchema)