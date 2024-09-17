const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
    },
    lastname:{
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 20,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    }
})

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;