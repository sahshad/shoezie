const User = require('../model/user')
const Product = require('../model/product')
const bcrypt = require('bcrypt')
const saltRounds = 10;
function getLogin(req,res){
    res.render('user/login')
}

function getSignup(req,res){
    
    res.render('user/signup')
}

 async function addUser (req, res){
const {firstname,lastname,email,password} = req.body
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({firstname,lastname, email, password:hashedPassword,
            
         });
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
}

async function getHome(req,res){
  const product =await Product.find({})
    res.render('user/home',{product})
}

async function getShop(req,res){
    const product = await Product.find({})
    res.render('user/shop',{product})
}


module.exports ={
    getLogin,getSignup,addUser,getHome,getShop
}