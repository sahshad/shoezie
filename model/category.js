const mongoose =require('mongoose')

const categorySchema = new mongoose.Schema({
  name:{type:String,required:true,unique:true},
  imageUrl:{type:String,required:true},
  status: { type: Boolean, default: true },
  offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }]
},
{timestamps:true})

module.exports = mongoose.model('Category',categorySchema)