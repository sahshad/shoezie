const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref: 'User',required:true},
    fullname: {  type: String, required: true,  },
    phoneNumber: {  type: String,minlength:10,required: true,},
    pincode: {type: String,required: true,},
    address: {type: String,required: true, },
    city: {type: String,required: true,},
    district: {type: String,required: true,},
    state: {type: String,required: true,},
    country: { type: String, required: true,},
    type: { type: String,required: true,},
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
