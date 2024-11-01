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
        res.render('admin/products',{product,category , currentPage:'products'})

    } catch (error) {
        console.log(error);
    }
}

const addProduct = (req, res) => {
    const { productName, productDescription, productCategory, productPrice, productSize, productStock } = req.body;

    if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ success:false , message: 'No images uploaded' });
    }

    const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'product' },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result.secure_url); 
                }
            );

            streamifier.createReadStream(file.buffer).pipe(stream);
        });
    });

    Promise.all(uploadPromises)
        .then(async (imageUrls) => {
            const sizesWithStocks = productSize.map((size, index) => ({
                size,
                stock: productStock[index] 
            }));
            const newProduct = new Product({
                name: productName,
                description: productDescription,
                category: productCategory,
                price: productPrice,
                sizes: sizesWithStocks, 
                imageUrls, 
            });

            try {
                await newProduct.save();
                return res.status(201).json({ success:true , message : 'Product added succesfully'})
            } catch (dbError) {
                console.error(dbError);
                return res.status(500).json({ success:false , message: 'Error saving product to database', dbError });
            }
        })
        .catch(uploadError => {
            console.error(uploadError);
            return res.status(500).json({ success:false , message: 'Error uploading images to Cloudinary', uploadError });
        });
};

async function editProduct(req, res) {
    const{id} = req.params
    const {name, description, category, price, sizes, newImages, deletedImages, deletedSizes } = req.body;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success:false , message: 'Product not found' });
        }
        const updates = {};

        if (name && name !== product.name) updates.name = name;
        if (description && description !== product.description) updates.description = description;
        if (category && category !== product.category) updates.category = category;
        if (price && price !== product.price) updates.price = price;

        if (sizes) {
            sizes.forEach(size => {
                if (size.id) {
                    const existingSizeIndex = product.sizes.findIndex(s => s._id.toString() === size.id);
                    if (existingSizeIndex !== -1) {
                        product.sizes[existingSizeIndex].size = size.size;
                        product.sizes[existingSizeIndex].stock = size.stock;
                    }
                } else {
                    product.sizes.push({ size: size.size, stock: size.stock });
                }
            });
            updates.sizes = product.sizes;
        }

        if (deletedSizes && deletedSizes.length > 0) {
            product.sizes = product.sizes.filter(size => !deletedSizes.includes(size._id.toString()));
            updates.sizes = product.sizes; 
        }

 if (newImages && newImages.length > 0) {
    const uploadPromises = newImages.map(image => {
        return cloudinary.uploader.upload(image, {
            folder: 'products',
        });
    });

    const uploadResponses = await Promise.all(uploadPromises);

    const imageUrls = uploadResponses.map(response => response.secure_url);

    updates.imageUrls = [...product.imageUrls, ...imageUrls];
}

if (deletedImages && deletedImages.length > 0) {
    const deletePromises = deletedImages.map(async (imageUrl) => {
        const publicId = imageUrl.split('/').pop().split('.')[0]; 
        await cloudinary.uploader.destroy(publicId); 
    });

    await Promise.all(deletePromises);

    product.imageUrls = product.imageUrls.filter(url => !deletedImages.includes(url));
    updates.imageUrls = product.imageUrls; 
}
        const result = await Product.findByIdAndUpdate(id, updates, { new: true });
        
      if(result){
        res.status(200).json({ success:true , message: 'Product updated successfully' });
      }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success:false , message: 'Error updating product', error });
    }
}

async function changeProductStatus (req, res){
    const { action, id } = req.params;
    try {
        const newStatus = action === 'list'; 
        const result=await Product.findByIdAndUpdate(id, { status: newStatus });
        if(result)
        res.status(200).json({ success:true , message: `Product ${action === 'list' ? 'listed' : 'unlisted'} successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success:false , message: 'Error toggling product status.', error });
    }
}

module.exports = {
    getProducts,addProduct, editUpload: upload.array('editProductImage[]'),addUpload:upload.array('productImage[]'),editProduct,changeProductStatus
}