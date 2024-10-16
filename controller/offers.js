const Product = require('../model/product')
const Category = require('../model/category')
const Offer = require('../model/offers')

async function getOffers(req,res){
    const offers = await Offer.find().populate('targetId')
    res.render('admin/offers',{offers})
}


async function createOffer(req, res) {
    try {
        const { targetName, offerFor, offerType, value, maxDiscount, expiresAt } = req.body;

        if (!targetName || !offerFor || !offerType || value == null || !expiresAt) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        if (offerType === 'percentage' && (value < 0 || value > 100)) {
            return res.status(400).json({ success: false, message: 'Percentage value must be between 0 and 100.' });
        }

        if (offerType === 'percentage' && maxDiscount != null && maxDiscount <= 0) {
            return res.status(400).json({ success: false, message: 'Max discount must be positive.' });
        }

        let target;

        if (offerFor === 'Product') {   
              
            target = await Product.findOne({ 
                name: { $regex: new RegExp(`^${targetName}$`, 'i') }
            });

            const newOffer = new Offer({
                targetId: target._id,
                offerFor,
                offerType,
                value,
                maxDiscount: maxDiscount || null,
                expiresAt,
            });
            await newOffer.save();

                const product = await Product.findById(target._id );

                const offer = await Offer.findOne({targetId:target._id})
                console.log(product,offer);
                
                addOfferReference(product._id, offer._id)
                return res.status(201).json({ success: true, message: 'Product offer applied successfully.', offer: newOffer });

     } else if (offerFor === 'Category') {

            target = await Category.findOne({ 
                name: { $regex: new RegExp(`^${targetName}$`, 'i') }
            });

            const newOffer = new Offer({
                targetId: target._id,
                offerFor,
                offerType,
                value,
                maxDiscount: maxDiscount || null,
                expiresAt,
            });
            await newOffer.save();
             
            const category = await Category.findById(target._id)
            const offer = await Offer.findOne({targetId:target._id})
            
            if (!category.offers) {
                category.offers = []; 
            }
            console.log(category);

            category.offers.push(offer._id); 
            await category.save();
        
                const products = await Product.find({ category: target._id });
                // const offer = await Offer.findOne({targetId:target._id})
                await Promise.all(products.map(product => addOfferReference(product._id, offer._id)));

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


// async function applyBestOfferToProduct(productId, newOffer) {
//     let discountAmount = 0;
//     const product = await Product.findById(productId)
//     let offerPrice = product.price;
// console.log(product,newOffer);

//     // Calculate discount amount based on the offer type
//     if (newOffer.offerType === 'percentage') {
//         discountAmount = (newOffer.value / 100) * product.price;
//         if (newOffer.maxDiscount) discountAmount = Math.min(discountAmount, newOffer.maxDiscount);
//     } else if (newOffer.offerType === 'flat') {
//         discountAmount = newOffer.value;
//     }

//     offerPrice = Math.max(product.price - discountAmount, 0);

//     // Determine whether to apply category or product offer
//     const existingOffer = product.offerDetails;
//     if (!existingOffer || offerPrice < existingOffer.offerPrice) {
//         product.offerDetails = {
//             offerId: newOffer._id,
//             offerPrice,
//             discountAmount,
//             offerType : newOffer.offerType,
//             expiresAt: newOffer.expiresAt,
//         };

//         // If this is a category-level offer, update the category offer field as well
//         if (newOffer.offerFor === 'Category') {
//             product.categoryOfferDetails = {
//                 offerId: newOffer._id,
//                 offerPrice,
//                 discountAmount,
//                 offerType : newOffer.offerType,
//                 expiresAt: newOffer.expiresAt,
//             };
//         }
//     }
// console.log(product);

//     // Save the updated product
//     await product.save();
// }



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
module.exports = { getOffers,createOffer,changeOfferStatus }