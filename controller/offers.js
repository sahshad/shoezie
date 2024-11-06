const Product = require('../model/product')
const Category = require('../model/category')
const Offer = require('../model/offers')

async function getOffers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit; 

        const offers = await Offer.find()
            .populate('targetId')
            .skip(skip)
            .limit(limit);

        const totalOffers = await Offer.countDocuments(); 
        const totalPages = Math.ceil(totalOffers / limit); 

        res.render('admin/offers', {
            offers,
            activePage: 'offers',
            currentPage: page,
            totalPages,
            limit,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

async function createOffer(req, res) {
    try {
        const { targetName, offerFor, offerType, value, maxDiscount, expiresAt,minProductPrice } = req.body;

        if (!targetName || !offerFor || !offerType || value == null || !expiresAt) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        if (offerType === 'percentage' && (value < 0 || value > 80)) {
            return res.status(400).json({ success: false, message: 'Percentage value must be between 0 and 80.' });
        }

        if (offerType === 'percentage' && maxDiscount != null && maxDiscount <= 0) {
            return res.status(400).json({ success: false, message: 'Max discount must be positive.' });
        }

        let target;

        if (offerFor === 'Product') {   
              
            target = await Product.findOne({ 
                name: { $regex: new RegExp(`^${targetName}$`, 'i') }
            });

            if(!target){
                return res.status(400).json({ success:false , message: 'product not found. please check product name'})
            }

            if(value > target.price ){
            return res.status(400).json({ success: false, message: 'Offer value is greater than product price' });
            }

            const newOffer = new Offer({
                targetId: target._id,
                offerFor,
                offerType,
                value,
                maxDiscount: maxDiscount || null,
                minProductPrice:minProductPrice || null,
                expiresAt,
            });
            const offer = await newOffer.save();
           
                const product = await Product.findById(target._id );

                addOfferReference(product._id, offer._id)
                return res.status(201).json({ success: true, message: 'Product offer applied successfully.', offer: newOffer });

     } else if (offerFor === 'Category') {

            target = await Category.findOne({ 
                name: { $regex: new RegExp(`^${targetName}$`, 'i') }
            });

            if(!target){
                return res.status(400).json({ success:false , message: 'category not found. please check category name'})
            }

            const newOffer = new Offer({
                targetId: target._id,
                offerFor,
                offerType,
                value,
                maxDiscount: maxDiscount || null,
                minProductPrice:minProductPrice || null,
                expiresAt,
            });
            const offer = await newOffer.save();
             
            const category = await Category.findById(target._id)

            addOfferReferenceToCategory(category._id, offer._id)
           
        
                // const products = await Product.find({ category: target._id });
                // // const offer = await Offer.findOne({targetId:target._id})
                // await Promise.all(products.map(product => addOfferReference(product._id, offer._id,minProductPrice)));

                return res.status(201).json({ success: true, message: 'Category offer applied successfully.', offer: newOffer });
        }

        if (!target) {
            return res.status(404).json({ success: false, message: `${offerFor} not found.` });
        }

    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while creating the offer.' });
    }
}


async function addOfferReference(productId, offerId) {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        if (!product.offers) {
            product.offers = []; 
        }
        product.offers.push(offerId); 
        await product.save();

        console.log(`Offer ${offerId} added to product ${productId}`);
    } catch (error) {
        console.error(error.message);
        throw new Error('Error adding offer reference');
    }
}

async function changeOfferStatus(req,res){
    const { id, status } = req.params;

    try {
        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        
        offer.isActive = status === 'true'; 
        await offer.save();

        res.json({ success: true, message: 'Status updated successfully', isActive: offer.isActive });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function editOffer(req, res) {
    try {
        const { id, targetName, offerFor, offerType, value, maxDiscount, expiresAt, minProductPrice } = req.body;

        if (!id || !targetName || !offerFor || !offerType || value == null || !expiresAt) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        if (offerType === 'percentage' && (value < 0 || value > 80)) {
            return res.status(400).json({ success: false, message: 'Percentage value must be between 0 and 80.' });
        }

        if (offerType === 'percentage' && maxDiscount != null && maxDiscount <= 0) {
            return res.status(400).json({ success: false, message: 'Max discount must be positive.' });
        }

        const existingOffer = await Offer.findById(id);
        if (!existingOffer) {
            return res.status(404).json({ success: false, message: 'Offer not found.' });
        }

        const oldTargetId = existingOffer.targetId;

        let newTarget;

        if (offerFor === 'Product') {
            newTarget = await Product.findOne({ name: { $regex: new RegExp(`^${targetName}$`, 'i') } });
            if(!newTarget){
                return res.status(400).json({ success:false , message :'Product not found'})
            }
            if(value >= newTarget.price ){
                return res.status(400).json({ success: false, message: 'Offer value is greater than product price' });
                }
        } else if (offerFor === 'Category') {
            newTarget = await Category.findOne({ name: { $regex: new RegExp(`^${targetName}$`, 'i') } });
        }

        if (!newTarget) {
            return res.status(404).json({ success: false, message: `Category not found.` });
        }

        const hasOfferForChanged = existingOffer.offerFor !== offerFor 
        
        if(existingOffer.offerFor === offerFor && oldTargetId.toString() !== newTarget._id.toString()){
            console.log('hi');
            
            if (existingOffer.offerFor === 'Product') {
                await removeOfferReference(oldTargetId, existingOffer._id);
                await addOfferReference(newTarget._id, existingOffer._id);
            } else if (existingOffer.offerFor === 'Category') {   
                await removeOfferReferenceFromCategory(oldTargetId, existingOffer._id);
                await addOfferReferenceToCategory(newTarget._id, existingOffer._id);
            }
        } 

        if (hasOfferForChanged) {
            if (oldTargetId) {
                if (existingOffer.offerFor === 'Product') {
                    await removeOfferReference(oldTargetId, existingOffer._id);
                } else if (existingOffer.offerFor === 'Category') {   
                    await removeOfferReferenceFromCategory(oldTargetId, existingOffer._id);
                }
            }
        }

        existingOffer.offerFor = offerFor;
        existingOffer.offerType = offerType;
        existingOffer.value = value;
        existingOffer.maxDiscount = maxDiscount || null;
        existingOffer.minProductPrice = minProductPrice || null;
        existingOffer.expiresAt = expiresAt;
        existingOffer.targetId = newTarget._id;
                    
        await existingOffer.save();

        if (hasOfferForChanged) {
            if (offerFor === 'Product') {
                await addOfferReference(newTarget._id, existingOffer._id);
            } else if (offerFor === 'Category') {
                await addOfferReferenceToCategory(newTarget._id, existingOffer._id);
            }
        }

        return res.status(200).json({ success: true, message: 'Offer updated successfully.', offer: existingOffer });

    } catch (error) {
        console.error('Error editing offer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while editing the offer.' });
    }
}

async function removeOfferReference(productId, offerId) {
    console.log(productId, offerId);
    
    try {
        const product = await Product.findById(productId);
        console.log(product);
        
        if (!product) {
            throw new Error('Product not found');
        }

        product.offers = product.offers.filter(offer => !offer.equals(offerId));
        await product.save();

        console.log(`Offer ${offerId} removed from product ${productId}`);
    } catch (error) {
        console.error(error.message);
        throw new Error('Error removing offer reference');
    }
}

async function removeOfferReferenceFromCategory(categoryId, offerId) {
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        category.offers = category.offers.filter(offer => !offer.equals(offerId));
        await category.save();

        console.log(`Offer ${offerId} removed from category ${categoryId}`);
    } catch (error) {
        console.error(error.message);
        throw new Error('Error removing offer reference from category');
    }
}

async function addOfferReference(productId, offerId) {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        if (!product.offers) {
            product.offers = [];
        }
        product.offers.push(offerId);
        await product.save();

        console.log(`Offer ${offerId} added to product ${productId}`);
    } catch (error) {
        console.error(error.message);
        throw new Error('Error adding offer reference');
    }
}

async function addOfferReferenceToCategory(categoryId, offerId) {
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        if (!category.offers) {
            category.offers = [];
        }
        category.offers.push(offerId);
        await category.save();

        console.log(`Offer ${offerId} added to category ${categoryId}`);
    } catch (error) {
        console.error(error.message);
        throw new Error('Error adding offer reference to category');
    }
}



module.exports = { getOffers,createOffer,changeOfferStatus,editOffer }