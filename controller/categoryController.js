require('dotenv').config()
const cloudinary = require('../config/cloudinary')
const Category = require('../model/category')
const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const streamifier = require('streamifier')

async function getCategory(req, res) {
    const category = await Category.find({})
    res.render('admin/category',{category});
}


function addCategory(req,res){
   const {categoryName} =req.body
   console.log(categoryName);
   console.log(req.file);

    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }

    // Create a stream from the buffer
    const stream = cloudinary.uploader.upload_stream(
        { folder: 'category' }, // Specify the folder in Cloudinary
        async (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Error uploading to Cloudinary', error });
            }

            // Create a new product document
            const newCategory = new Category({
                name: categoryName,
                imageUrl: result.secure_url,
            });

            try {
                // Save the product to the database
                await newCategory.save();
                // res.status(200).json({
                //     message: 'Product added successfully!',
                //     imageUrl: result.secure_url,
                // });
                return res.redirect('/admin/category')
            } catch (dbError) {
                console.error(dbError);
                res.status(500).json({ message: 'Error saving product to database', dbError });
            }
        }
    );

    // Stream the buffer to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(stream);
};


module.exports = {getCategory,addCategory, uploadCategory:upload.single('categoryImage')}