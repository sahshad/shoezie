const User = require('../model/user')
const Product = require('../model/product')
const Category = require('../model/category')
const bcrypt = require('bcrypt')

function getLogin(req,res){
    let error
   if(req.session.error){
     error = req.session.error
    delete req.session.error
   }else{
    error=''
   }
    res.render('user/login',{error})
}

function getSignup(req,res){
    let error
    if(req.session.error){
      error = req.session.error
     delete req.session.error
    }else{
     error=''
    }
    res.render('user/signup',{error})
}

async function getProfile(req,res){
    const _id = req.session.user

 const user=await User.findOne({_id})
 console.log(user);
 
   res.render('user/profile',{user})
}
function getAddress(req,res){
    res.render('user/address')
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

async function userLogIn(req,res){
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.session.error = 'user not found'
            return res.redirect('/user/login') 
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(user.isBlock===false){
        if (isMatch) {
            req.session.user = user.id;
            return res.redirect('/user/profile');
        } else {
            req.session.error = 'incorrect password'
            return res.redirect('/user/login') 
        }
    }else{
        res.send('you are blocked')
    }
    } catch (error) {
        console.error(error);
        return res.send('An error occurred');
    }
}

 async function addUser (req, res){
const {firstname,lastname,email,password} = req.body
const saltRounds = 10;
    try {
        const user = await User.findOne({email})
        if(user){
            req.session.error='email already exist'
            return res.redirect('/user/signup')
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({firstname,lastname, email, password:hashedPassword
            
         });
        await newUser.save();
        req.session.error='User registered successfully'
        return res.redirect('/user/login')
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
         req.session.error='Error registering user'
        return res.redirect(500,'/user/signup')
        res.status(500).send('Error registering user');
    }
}

async function getHome(req,res){
  const product = await Product.find({}).limit(4)
  const category = await Category.find({})
    res.render('user/home',{product,category})
}

async function getShop(req,res){
    const product = await Product.find({})
    res.render('user/shop',{product})
}

async function getProduct(req,res){
    const productId = req.params.id // Get the ID from the route parameters
    const product = await Product.findById(productId)

    if (product) {
        res.render('user/productView', { product });
    } else {
        res.status(404).send('Product not found'); 
    }
}

module.exports ={
    getLogin,getSignup,addUser,getHome,getShop,
    getProduct,getProfile,userLogIn,userLogOut,
    getAddress,getOrders,getOrderDetails

}