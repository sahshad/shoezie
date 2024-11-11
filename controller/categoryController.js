require('dotenv').config()
const cloudinary = require('../config/cloudinary')
const Category = require('../model/category')
const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const streamifier = require('streamifier')

async function getCategory(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const category = await Category.find()
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('admin/category', {
            category,
            activePage: 'category',
            currentPage: page,
            totalPages,
            limit,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

async function addCategory(req, res) {
    const { categoryName } = req.body;

    if (!categoryName) {
        return res.status(404).json({ message: 'Category name is required' });
    }
    if (!req.file) {
        return res.status(404).json({ message: 'No image uploaded' });
    }

    try {
        const categoryExist = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
        if (categoryExist) {
            return res.status(409).json({ success: false, message: 'Category already exists' });
        }

        const stream = cloudinary.uploader.upload_stream(
            { folder: 'category' }, 
            async (error, result) => {
                if (error) {
                    return res.status(500).json({ message: 'Error uploading to Cloudinary', error });
                }

                try {
                    const newCategory = new Category({
                        name: categoryName,
                        imageUrl: result.secure_url,
                    });

                    await newCategory.save();
                    return res.status(201).json({ success: true, message: 'Category added successfully' });
                } catch (dbError) {
                    console.error(dbError);
                    return res.status(500).json({ success:false, message: 'Error saving category to database', dbError });
                }
            }
        )

        streamifier.createReadStream(req.file.buffer).pipe(stream);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Unexpected error occurred', err });
    }
}

async function changeCategoryStatus(req,res) {
    const { action, id } = req.params;
    
    try {
        const newStatus = action === 'list'
        const result=await Category.findByIdAndUpdate(id, { status: newStatus });
        if(result)
        res.status(200).json({ success: true , message: `Category ${action === 'list' ? 'listed' : 'unlisted'} successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success:false , message: 'Error toggling product status.', error });
    }
    
}

async function editCategory(req, res) {
    const { id } = req.params; 
    const { categoryName } = req.body; 
    const imageFile = req.file; 

    try {
        const category = await Category.findById(id);
        
        if (!category) {
            return res.status(404).json({ success:false , message: 'Category not found' });
        }

        if(category.name !== categoryName){
            const categoryExist = await Category.findOne({name: new RegExp(`^${categoryName}$`,'i')})
             if(categoryExist){
                return res.status(409).json({success:false , message: 'category name already exist'})
             }
        }

        category.name = categoryName
        if (imageFile) {

            const stream = streamifier.createReadStream(imageFile.buffer);
            const uploadPromise = new Promise((resolve, reject) => {
                streamifier.createReadStream(imageFile.buffer)
                    .pipe(cloudinary.uploader.upload_stream(
                        { folder: 'Category' }, 
                        (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result.secure_url);
                            }
                        }
                    ));
            });

            const secureUrl = await uploadPromise;
            category.imageUrl = secureUrl;
        }
        await category.save();

        return res.status(200).json({ success:true , message: 'Category updated successfully'});
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ success:false , message: 'Server error', error });
    }
}

module.exports = {getCategory,addCategory, 
    uploadCategory:upload.single('categoryImage'),
    changeCategoryStatus,editCategory
}