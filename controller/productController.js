const Product = require('../model/product')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const multer = require('multer')
require('dotenv').config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function getProducts(req, res) {

    try {
        const product =await Product.find({})
        res.render('admin/products',{product})

    } catch (error) {
        
    }
}

// async function addProduct(req,res){
//     const  { productName, productDescription,
//  productPrice, productCategory, productStock } = req.body;


 
//     try {
//         const newProduct = new Product({
//           name: productName,
//           description: productDescription,
//           price: productPrice,
//           category: productCategory,
//           stock: productStock
//         });
        
//         await newProduct.save();
//        return res.redirect('/admin/products')
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }

// }



const addProduct = (req, res) => {
    const { productName, productDescription, productCategory, productPrice, productStock } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }

    // Create a stream from the buffer
    const stream = cloudinary.uploader.upload_stream(
        { folder: 'product' }, // Specify the folder in Cloudinary
        async (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Error uploading to Cloudinary', error });
            }

            // Create a new product document
            const newProduct = new Product({
                name: productName,
                description: productDescription,
                category: productCategory,
                price: productPrice,
                stock: productStock,
                imageUrl: result.secure_url,
            });

            try {
                // Save the product to the database
                await newProduct.save();
                // res.status(200).json({
                //     message: 'Product added successfully!',
                //     imageUrl: result.secure_url,
                // });
                return res.redirect('/admin/products')
            } catch (dbError) {
                console.error(dbError);
                res.status(500).json({ message: 'Error saving product to database', dbError });
            }
        }
    );

    // Stream the buffer to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(stream);
};

 async function deleteProduct (req, res){
    const productId = req.params.id;
    try {
        await Product.findByIdAndDelete(productId); // Adjust based on your database setup
        res.status(200).send({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send({ message: 'Failed to delete product' });
    }
}

module.exports = {
    getProducts,addProduct, upload: upload.single('productImage'),deleteProduct
}