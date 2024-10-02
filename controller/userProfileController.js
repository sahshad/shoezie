const User = require('../model/user')
const Address = require('../model/address')

async function getProfile(req,res){
    const _id = req.session.user

 const user=await User.findOne({_id})
 console.log(user);
 
   res.render('user/profile',{user})
}
async function getAddress(req,res){
    const userId = req.session.user
    const address = await Address.find({user:userId})
  
    res.render('user/address',{address})
}

function getOrders(req,res){
    res.render('user/order')
}

function getOrderDetails(req,res){
  res.render('user/orderDetails')
}

function userLogOut(req,res){
        req.session.destroy(err => {
            if (err) {
                return res.redirect('/user/profile'); // Redirect to profile on error
            }
           return res.redirect('/user/login'); // Redirect to login on success
        });
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
     city, district, state, country, type  } = req.body;
     const userId = req.session.user
     try {  
        // Create a new address instance
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

module.exports = {
    getProfile,userLogOut,
    getAddress,getOrders,getOrderDetails,
    updateUserDetails,addAddress,updateAddress
}