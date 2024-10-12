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
            return res.redirect('/user/profile');
        } else {
            req.session.error = 'incorrect password'
            return res.redirect('/user/login') 
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
        return res.redirect(201,'/user/login')
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
         req.session.error='Error registering user'
        return res.redirect(500,'/user/signup')
        res.status(500).send('Error registering user');
    }
}

async function getHome(req,res){
  const product = await Product.find({status:true}).populate('category').sort({createdAt:-1}).limit(4)
  const category = await Category.find({})
    res.render('user/home',{product,category})
}

async function getShop(req,res){
    const category = await Category.find({})
    const product = await Product.find({}).populate('category')
    res.render('user/shop',{product,category})
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

async function sortProducts(req, res) {
    const sort = req.query.sortedby;
    const sizes = req.query.sizes ? JSON.parse(req.query.sizes) : [];
    const categories = req.query.categories ? JSON.parse(req.query.categories) : [];

    // Log the received values for debugging
    console.log('Received sizes:', sizes);
    console.log('Received categories:', categories);
    
    let sortOptions

    // Determine sort options based on the sortedby parameter
    switch (sort) {
        case 'popularity':
            // Assuming you have a field for popularity, e.g., `popularity` in your model
            sortOptions = { popularity: -1 }; // Sort by popularity descending
            break;
        case 'priceLowToHigh':
            sortOptions = { price: 1 }; // Sort by price ascending
            break;
        case 'priceHighToLow':
            sortOptions = { price: -1 }; // Sort by price descending
            break;
        case 'averageRating':
            // Assuming you have a field for average rating
            sortOptions = { averageRating: -1 }; // Sort by average rating descending
            break;
        case 'newArrivals':
            sortOptions = { createdAt: -1 }; // Sort by creation date descending
            break;
        case 'featured':
            // Assuming you have a field for featured products
            sortOptions = { isFeatured: -1 }; // Sort by featured flag (if applicable)
            break;
        case 'aToz':
            sortOptions = { name: 1 }; // Sort by name ascending
            break;
        case 'zToa':
            sortOptions = { name: -1 }; // Sort by name descending
            break;
        default:
            sortOptions= {name : 1}
            // return res.status(400).json({ error: 'Invalid sort criteria' });
    }
    const query = {};

        // Filter by category
        if (categories.length > 0) {
            query.category = { $in: categories }; // Match any of the specified categories
        }

        // Filter by size
        if (sizes.length > 0) {
            query.sizes = {
                $elemMatch: {
                    size: { $in: sizes } // Match any of the specified sizes
                }
            };
        }

    try {
        // Fetch sorted products from the database
        const product = await Product.find(query).sort(sortOptions);
        const category = await Category.find({})
        res.render('user/shop',{product,category})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching products' });
    }
}

module.exports ={
    getLogin,getSignup,addUser,getHome,getShop,
    getProduct,userLogIn,sortProducts
}