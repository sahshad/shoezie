require('dotenv').config()
const User = require('../model/user')
const Product = require('../model/product')
const Category = require('../model/category')
const bcrypt = require('bcrypt')
const speakeasy = require('speakeasy')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const {sendOTP} = require('../utils/emailUtils')

const  { getBestOffer } = require('../utils/offerUtils')

function getLogin(req,res){
    let error
    if(req.session.user){
      return  res.redirect('/user/home')
    }
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

async function userLogIn(req,res){
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.session.error = 'user not found'
            return res.redirect('/user/login') 
        }
        const isMatch = await bcrypt.compare(password, user.password);
    
        if(user.status === false){
            req.session.error = 'you have been blocked'
            return res.redirect('/user/login') 
        }

        if (isMatch) {
            req.session.user = user.id;
            return res.redirect('/user/home');
        } else {
            req.session.error = 'incorrect password'
            return res.redirect('/user/login') 
        }
 
    } catch (error) {
        console.error(error);
        return res.send('An error occurred');
    }
}

async function addUser(req, res) {

    const { firstname, lastname, email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            req.session.error = 'Email already exists';
            return res.redirect('/user/signup');
        }

        req.session.firstname = firstname;
        req.session.lastname = lastname;
        req.session.email = email;
        req.session.password = password; 

        const secret = speakeasy.generateSecret({ length: 20 });
        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
        });

        req.session.otpSecret = secret.base32;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP is: ${token}. It is valid for 1 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        req.session.otpEmail = email;

        return res.redirect('/user/verify-otp');
        
    } catch (error) {
        console.error(error);
        req.session.error = 'Error registering user';
        return res.redirect('/user/signup');
    }
}

async function getOtpPage(req,res){
    res.render('user/otp')
}

async function verifyOtp(req, res) {
    const { otp } = req.body;
    try {
        if(!req.session.email){
            return res.status(400).json({success:false,message: 'No email found. Please register again'});
        }
        const isValidOTP = speakeasy.totp.verify({
            secret: req.session.otpSecret,
            encoding: 'base32',
            token: otp,
            window: 2,
        });
    
        if (isValidOTP) {
    
            const { firstname, lastname, email, password } = req.session;
            const saltRounds = 10;
    
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newUser = new User({ firstname, lastname, email, password: hashedPassword });
            await newUser.save();
    
            delete req.session.firstname;
            delete req.session.lastname;
            delete req.session.email;
            delete req.session.password;
            delete req.session.otpSecret;
    
            return res.status(201).json({success:true , message:'OTP verified successfully!'})
        } else {
            return res.status(400).json({success:false,message: 'Invalid or expired OTP',});
        }
    } catch (error) {
        return res.status(400).json({error: error,});
    }
}

async function resendOtp(req,res) {
    const { email } = req.session;

    try {

        if (!req.session.email) {
            return res.status(400).json({ success:false, message: 'No email found. Please register again' });
        }

        const otp = speakeasy.totp({
            secret: req.session.otpSecret,
            encoding: 'base32',
            window: 2, 
        });

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP is: ${otp}. It is valid for 1 minute.`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ seccess:true, message: 'OTP has been resent to your email.' });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success:false, message: 'Error resending OTP. Please try again.' });
    }
}

async function getHome(req,res){
  const products = await Product.find({status:true}).populate('category')
  .populate('offers').sort({createdAt:-1}).limit(4)

  const productsWithBestOffers = await Promise.all(products.map(async product => {
    const category = await Category.findById(product.category).populate('offers');
    const categoryOffers = category ? category.offers : [];

    const combinedOffers = [...product.offers, ...categoryOffers];

    const validOffers = combinedOffers.filter(offer => {
        if (offer.offerType === 'flat' && offer.value > product.price || new Date(offer.expiresAt) < new Date()) {
            return false; 
        }
        return true;
    });

    const hasValidOffer = validOffers.some(offer => {
        return offer.minProductPrice && offer.minProductPrice >= product.price;
    });
    let bestOffer = null;

    if (!hasValidOffer) {
        bestOffer = await getBestOffer(validOffers, product.price);
    }

    return {
        ...product.toObject(),
        bestOffer
    };
}));

  const category = await Category.find({})
    res.render('user/home',{product:productsWithBestOffers,category})
}

async function getShop(req, res) {
    try {
        const categories = await Category.find({});
        const products = await Product.find({ status: true })
            .populate('category')
            .populate('offers');
        const productsWithBestOffers = await Promise.all(products.map(async product => {
            const category = await Category.findById(product.category).populate('offers');
            const categoryOffers = category ? category.offers : [];
        
            const combinedOffers = [...product.offers, ...categoryOffers];
        
            const validOffers = combinedOffers.filter(offer => {
                if (offer.offerType === 'flat' && offer.value > product.price || new Date(offer.expiresAt) < new Date()) {
                    return false;
                }
                return true;
            });
        
            const hasValidOffer = validOffers.some(offer => {
                return offer.minProductPrice && offer.minProductPrice >= product.price;
            });
        
            let bestOffer = null;
        
            if (!hasValidOffer) {
                bestOffer = await getBestOffer(validOffers, product.price);
            }
        
            return {
                ...product.toObject(),
                bestOffer
            };
        }));
        
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ products: productsWithBestOffers, category: categories });
        }

        res.render('user/shop', { product: productsWithBestOffers, category: categories });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
}

async function getProduct(req,res){
    const productId = req.params.id 
    const product = await Product.findById(productId)
    .populate('offers');
    const relatedProducts = await Product.find({category:product.category}) 

    const filteredRelatedProducts = relatedProducts.filter(
        relatedProduct => relatedProduct._id.toString() !== product._id.toString()
    );

    const category = await Category.findById(product.category).populate('offers')
    const categoryOffers = category ? category.offers : [];

    const combinedOffers = [...product.offers, ...categoryOffers];
    // const hasValidOffer = combinedOffers.some(offer => offer.minProductPrice >= product.price);

    
    //         let bestOffer = null;

    //         if (!hasValidOffer) {
    //             bestOffer = await getBestOffer(combinedOffers, product.price);
    //         }

    // const productsWithBestOffers={
    //     ...product.toObject(), 
    //      bestOffer 
    //     }
    const validOffers = combinedOffers.filter(offer => {
        if (offer.offerType === 'flat' && offer.value > product.price || new Date(offer.expiresAt) < new Date()) {
            return false; // Exclude this offer
        }
        return true; // Include this offer
    });

    const hasValidOffer = validOffers.some(offer => {
        return offer.minProductPrice && offer.minProductPrice >= product.price;
    });

    let bestOffer = null;

    if (!hasValidOffer) {
        bestOffer = await getBestOffer(validOffers, product.price);
    }

   const productsWithBestOffers = {
        ...product.toObject(),
        bestOffer
    };

    console.log(productsWithBestOffers);
    
    
    if (product) {
        res.render('user/productView', { product:productsWithBestOffers ,relatedProducts:filteredRelatedProducts});
    } else {
        res.status(404).send('Product not found'); 
    }
}

async function sortProducts(req, res) {

    const sort = req.query.sortedby;
    const sizes = req.query.sizes ? JSON.parse(req.query.sizes) : [];
    const categories = req.query.categories ? JSON.parse(req.query.categories) : [];
    const search = req.query.search
    
    let sortOptions

    switch (sort) {
        case 'popularity':
            sortOptions = { popularity: -1 }; 
            break;
        case 'priceLowToHigh':
            sortOptions = { price: 1 }; 
            break;
        case 'priceHighToLow':
            sortOptions = { price: -1 }; 
            break;
        case 'averageRating':
            sortOptions = { averageRating: -1 }; 
            break;
        case 'newArrivals':
            sortOptions = { createdAt: -1 }; 
            break;
        case 'featured':
            sortOptions = { isFeatured: -1 }; 
            break;
        case 'aToz':
            sortOptions = { name: 1 }; 
            break;
        case 'zToa':
            sortOptions = { name: -1 }; 
            break;
        default:
            sortOptions= {name : 1}
    }
    const query = {};

        if (categories.length > 0) {
            query.category = { $in: categories }; 
        }

        if (sizes.length > 0) {
            query.sizes = {
                $elemMatch: {
                    size: { $in: sizes } 
                }
            };
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' }; 
        }

    try {
        const products = await Product.find(query).sort(sortOptions).populate('category')
        const category = await Category.find({})

        const productsWithBestOffers = await Promise.all(products.map(async product => {
            const category = await Category.findById(product.category).populate('offers');
            const categoryOffers = category ? category.offers : [];
        
            // Combine product offers and category offers
            const combinedOffers = [...product.offers, ...categoryOffers];
        
            // Filter out offers that are "flat" and have a value greater than the product price
            const validOffers = combinedOffers.filter(offer => {
                if (offer.offerType === 'flat' && offer.value > product.price || new Date(offer.expiresAt) < new Date()) {
                    return false; // Exclude this offer
                }
                return true; // Include this offer
            });
        
            const hasValidOffer = validOffers.some(offer => {
                return offer.minProductPrice && offer.minProductPrice >= product.price;
            });
        
            let bestOffer = null;
        
            if (!hasValidOffer) {
                bestOffer = await getBestOffer(validOffers, product.price);
            }
        
            return {
                ...product.toObject(),
                bestOffer
            };
        }));
       
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return  res.status(200).json({products:productsWithBestOffers,category})
        }

        res.render('user/shop',{product:productsWithBestOffers,category})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching products' });
    }
}

async function forgotPassword(req,res) {
    res.render('user/forgotPassword')
}

async function sendOtp (req, res){
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({success:false, message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    req.session.otp = otp; // Store OTP in session
    req.session.email = email; // Store email for verification

    try {
        await sendOTP(email, otp);
        res.status(200).json({ success:true, message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({success:false,  message: 'Error sending OTP' });
    }
}

async function forgotPasswordVerifyOtp(req, res){
    const { otp } = req.body;

    if (req.session.otp && parseInt(otp) === req.session.otp) {
        req.session.verified = true; // Mark session as verified
        res.status(200).json({success:true, message: 'OTP verified successfully' });
    } else {
        res.status(400).json({success:false, message: 'Invalid OTP' });
    }
}

async function resetPassword (req, res) {
    const { password } = req.body;
console.log(password);

    if (!req.session.verified || !req.session.email) {
        return res.status(403).json({success:false, message: 'Unauthorized' });
    }

    try {
        const user = await User.findOne({ email: req.session.email });
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save the hashed password
        user.password = hashedPassword;
        await user.save();

        // Clear session data
        delete req.session.email
        delete req.session.verified
        delete req.session.otp

        res.status(200).json({ success:true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({success:false, message: 'Error resetting password' });
    }
}

async function forgotPasswordResendOtp(req, res){
    if (!req.session.email) {
        return res.status(400).json({success:false, message: 'No email found in session. Please start the process again.' });
    }

    const now = new Date().getTime();
    const lastSentTime = req.session.lastOtpSentTime || 0;
    const timeElapsed = (now - lastSentTime) / 1000; // in seconds

    if (timeElapsed < 60) {
        return res.status(429).json({
            message: `Please wait ${60 - Math.floor(timeElapsed)} seconds before requesting a new OTP.`,
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate new 6-digit OTP
    req.session.otp = otp;
    req.session.lastOtpSentTime = now; // Store the time when the OTP was sent

    sendOTP(req.session.email, otp)
        .then(() => {
            res.status(200).json({success:true, message: 'OTP resent successfully' });
        })
        .catch((error) => {
            console.error('Error sending OTP:', error);
            res.status(500).json({success:false, message: 'Error resending OTP. Please try again later.' });
        });
}
module.exports ={
    getLogin,getSignup,addUser,getHome,getShop,
    getProduct,userLogIn,sortProducts,getBestOffer,verifyOtp,getOtpPage,resendOtp,forgotPassword,sendOtp,
    forgotPasswordVerifyOtp,resetPassword,forgotPasswordResendOtp
}