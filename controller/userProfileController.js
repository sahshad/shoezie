const User = require('../model/user')
const Address = require('../model/address')
const Order = require('../model/order')
const bcrypt = require('bcrypt')

async function getProfile(req,res){
    const _id = req.session.user

 const user=await User.findOne({_id})
 
   res.render('user/profile',{user})
}
async function getAddress(req,res){
    const userId = req.session.user
    const user = await User.findById(userId)
    const address = await Address.find({user:userId})
  
    res.render('user/address',{address,user})
}

async function getOrders(req, res) {
  const userId = req.session.user;
  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit; 

  try {
      const user = await User.findById(userId);
      const order = await Order.find({ userId })
          .sort({ createdAt: -1 })
          .populate('items.productId')
          .skip(skip)
          .limit(limit);

      const totalOrders = await Order.countDocuments({ userId }); 
      const totalPages = Math.ceil(totalOrders / limit); 

      res.render('user/order', {
          order,
          user,
          currentPage: page,
          totalPages,
          limit
      });
  } catch (error) {
      console.log(error);
      res.status(500).send('Server Error');
  }
}

async function getOrderDetails(req, res) {
  const { orderId} = req.params; 
  try {
      const order = await Order.findById(orderId).populate('items.productId').populate('items.offerId')

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      
      res.render('user/orderDetails', { order });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

function userLogOut(req,res){
  
      if(req.session.user){
        delete req.session.user
        return res.redirect('/user/login');
      }else{
        return res.redirect('/user/profile');
      }
}

async function updateUserDetails(req,res){
    const userId = req.session.user  
    const { firstname, lastname, email, phone } = req.body; 
    try {
      if (!firstname || !lastname || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required.' });
      }
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          firstname,
          lastname,
          email,
          phone
        },
        { new: true, runValidators: true } 
      );
        if (!updatedUser) {
        return res.status(404).json({ error: 'User not found.' });
      }
      return res.status(200).json({ message: 'User details updated successfully', user: updatedUser });
  
    } catch (error) {
      return res.status(500).json({ error: 'Something went wrong, please try again.' });
    }
}

async function addAddress(req,res){
 const {fullname, phoneNumber, pincode, address,
     city, district, state, country, type  } = req.body

     const userId = req.session.user
     try {  
        const newAddress = new Address({
            user: userId, 
            fullname,
            phoneNumber,
            pincode,
            address,
            city,
            district,
            state,
            country,
            type
        }); 
         await newAddress.save();

         return res.status(201).redirect('/user/profile/address')
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error adding address', error });
        }
}

async function updateAddress(req,res){
    const {fullname, phoneNumber, pincode, address,
        city, district, state, country, type ,addressId } = req.body;
  const updatedData ={fullname, phoneNumber, pincode, address,
    city, district, state, country, type }
try {
    const updatetdAddress = await Address.findByIdAndUpdate( addressId ,
        updatedData, {new:true , runValidators:true}
     ) 
     if(updateAddress){
     return res.status(201).redirect('/user/profile/address')
     }

    } catch (error) {
    console.log(error); 
    return res.status(500).json({ message: 'Error editing address', error });  
    }       
}

async function deleteAddress(req, res) {
  const { addressId } = req.params;
  
  try {
    const result = await Address.findByIdAndDelete(addressId);
    
    if (!result) {
      return res.status(404).json({ success:false , message: 'Address not found' });
    }
    
    res.status(200).json({ success:true , message: 'Address deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false ,  message: 'Server error' });
  }
}

async function updatePassword(req,res){
   const userId = req.session.user
   const {newPassword , currentPassword} = req.body
   console.log(currentPassword,newPassword);
   
   try {
      const user = await User.findById(userId)

      if(!user.password){
        return res.status(400).json({success:false , title:'Password not found' , message:'please set a password via forgot password'})
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(400).json({ success: false , message: 'Current password is incorrect.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({success:false , message: 'New password must be at least 6 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ success:true , message: 'Password updated successfully.' });

   } catch (error) {
    console.error(error);
        res.status(500).json({success:false , message: 'Server error.' });
   }
}

module.exports = {
    getProfile,userLogOut,
    getAddress,getOrders,getOrderDetails,
    updateUserDetails,addAddress,updateAddress,deleteAddress,updatePassword
}