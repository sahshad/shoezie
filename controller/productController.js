require('dotenv').config()
const Product = require('../model/product')
const Category = require('../model/category')
const cloudinary = require('../config/cloudinary')
const streamifier = require('streamifier')
const multer = require('multer')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function getProducts(req, res) {

    try {
        const product =await Product.find({}).populate('category')
        const category = await Category.find({})
        res.render('admin/products',{product,category})

    } catch (error) {
        console.log(error);
        
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



// const addProduct = (req, res) => {
//     const { productName, productDescription, productCategory, productPrice, productStock } = req.body;
// console.log(req.files);

//     if (!req.files) {
//         return res.status(400).json({ message: 'No image uploaded' });
//     }

//     // Create a stream from the buffer
//     const stream = cloudinary.uploader.upload_stream(
//         { folder: 'product' }, // Specify the folder in Cloudinary
//         async (error, result) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Error uploading to Cloudinary', error });
//             }

//             // Create a new product document
//             const newProduct = new Product({
//                 name: productName,
//                 description: productDescription,
//                 category: productCategory,
//                 price: productPrice,
//                 stock: productStock,
//                 imageUrl: result.secure_url,
//             });

//             try {
//                 // Save the product to the database
//                 await newProduct.save();
//                 // res.status(200).json({
//                 //     message: 'Product added successfully!',
//                 //     imageUrl: result.secure_url,
//                 // });
//                 return res.redirect('/admin/products')
//             } catch (dbError) {
//                 console.error(dbError);
//                 res.status(500).json({ message: 'Error saving product to database', dbError });
//             }
//         }
//     );

//     // Stream the buffer to Cloudinary
//     streamifier.createReadStream(req.files.buffer).pipe(stream);
// };

const addProduct = (req, res) => {
    const { productName, productDescription, productCategory, productPrice, productSize, productStock } = req.body;

    if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'product' }, // Specify the folder in Cloudinary
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result.secure_url); // Resolve with the secure URL
                }
            );

            streamifier.createReadStream(file.buffer).pipe(stream);
        });
    });

    Promise.all(uploadPromises)
        .then(async (imageUrls) => {
            // Create an array of sizes and stocks
            const sizesWithStocks = productSize.map((size, index) => ({
                size,
                stock: productStock[index] // Make sure productStock is structured to match productSize
            }));

            // Create a new product document
            const newProduct = new Product({
                name: productName,
                description: productDescription,
                category: productCategory,
                price: productPrice,
                sizes: sizesWithStocks, // Save the array of sizes with their stocks
                imageUrls, // Save the array of image URLs
            });

            try {
                // Save the product to the database
                await newProduct.save();
                return res.redirect('/admin/products'); // Redirect after success
            } catch (dbError) {
                console.error(dbError);
                return res.status(500).json({ message: 'Error saving product to database', dbError });
            }
        })
        .catch(uploadError => {
            console.error(uploadError);
            return res.status(500).json({ message: 'Error uploading images to Cloudinary', uploadError });
        });
};


// const addProduct = (req, res) => {
//     const { productName, productDescription, productCategory, productPrice, productStock } = req.body;

//     if (!req.files || !Array.isArray(req.files)) {
//         return res.status(400).json({ message: 'No images uploaded' });
//     }

//     const uploadPromises = req.files.map(file => {
//         return new Promise((resolve, reject) => {
//             const stream = cloudinary.uploader.upload_stream(
//                 { folder: 'product' }, // Specify the folder in Cloudinary
//                 (error, result) => {
//                     if (error) {
//                         return reject(error);
//                     }
//                     resolve(result.secure_url); // Resolve with the secure URL
//                 }
//             );

//             streamifier.createReadStream(file.buffer).pipe(stream);
//         });
//     });

//     Promise.all(uploadPromises)
//         .then(async (imageUrls) => {
//             // Create a new product document
//             const newProduct = new Product({
//                 name: productName,
//                 description: productDescription,
//                 category: productCategory,
//                 price: productPrice,
//                 stock: productStock,
//                 imageUrls, // Save the array of image URLs
//             });

//             try {
//                 // Save the product to the database
//                 await newProduct.save();
//                 return res.redirect('/admin/products'); // Redirect after success
//             } catch (dbError) {
//                 console.error(dbError);
//                 return res.status(500).json({ message: 'Error saving product to database', dbError });
//             }
//         })
//         .catch(uploadError => {
//             console.error(uploadError);
//             return res.status(500).json({ message: 'Error uploading images to Cloudinary', uploadError });
//         });
// };

async function editProduct(req, res) {
    const { id, name, description, category, price, sizes, newImages, deletedImages, deletedSizes } = req.body;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const updates = {};

        // Check for changes in the product details
        if (name && name !== product.name) updates.name = name;
        if (description && description !== product.description) updates.description = description;
        if (category && category !== product.category) updates.category = category;
        if (price && price !== product.price) updates.price = price;

        // Handle sizes update
        if (sizes) {
            sizes.forEach(size => {
                if (size.id) {
                    // Update existing size
                    const existingSizeIndex = product.sizes.findIndex(s => s._id.toString() === size.id);
                    if (existingSizeIndex !== -1) {
                        product.sizes[existingSizeIndex].size = size.size;
                        product.sizes[existingSizeIndex].stock = size.stock;
                    }
                } else {
                    // Add new size
                    product.sizes.push({ size: size.size, stock: size.stock });
                }
            });
            updates.sizes = product.sizes; // Assign updated sizes to updates
        }

        // Handle deleted sizes
        if (deletedSizes && deletedSizes.length > 0) {
            product.sizes = product.sizes.filter(size => !deletedSizes.includes(size._id.toString()));
            updates.sizes = product.sizes; // Assign updated sizes to updates
        }

        // Handle new image uploads and deletions (same as before)...
 // Handle new image uploads
 if (newImages && newImages.length > 0) {
    const uploadPromises = newImages.map(image => {
        return cloudinary.uploader.upload(image, {
            folder: 'products', // optional: specify a folder
        });
    });

    // Wait for all images to upload
    const uploadResponses = await Promise.all(uploadPromises);

    // Extract the URLs from the upload responses
    const imageUrls = uploadResponses.map(response => response.secure_url);

    // Add the new image URLs to the existing ones
    updates.imageUrls = [...product.imageUrls, ...imageUrls];
}

// Handle deleted images
if (deletedImages && deletedImages.length > 0) {
    const deletePromises = deletedImages.map(async (imageUrl) => {
        const publicId = imageUrl.split('/').pop().split('.')[0]; // Assuming the URL structure allows for this
        await cloudinary.uploader.destroy(publicId); // Remove the image from Cloudinary
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    // Remove deleted images from the product's imageUrls
    product.imageUrls = product.imageUrls.filter(url => !deletedImages.includes(url));
    updates.imageUrls = product.imageUrls; // Assign updated imageUrls to updates
}
        // Update the product
        const result = await Product.findByIdAndUpdate(id, updates, { new: true });
        
      if(result){
        res.status(200).json({ message: 'Product updated successfully' });

      }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating product', error });
    }
}




async function changeProductStatus (req, res){
    const { action, id } = req.params;
    
    try {
        const newStatus = action === 'list'; // Set status based on action
        const result=await Product.findByIdAndUpdate(id, { status: newStatus });
        if(result)
        res.status(200).json({ message: `Product ${action === 'list' ? 'listed' : 'unlisted'} successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling product status.', error });
    }
}

module.exports = {
    getProducts,addProduct, editUpload: upload.array('editProductImage[]'),addUpload:upload.array('productImage[]'),editProduct,changeProductStatus
}