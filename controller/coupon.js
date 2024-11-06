const Coupon = require('../model/coupon')
const User = require('../model/user')

async function getCoupons(req, res) {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const coupons = await Coupon.find()
            .skip(skip)
            .limit(limit);

        const totalCoupons = await Coupon.countDocuments(); 
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('admin/coupons', {
            coupons,
            activePage: 'coupons',
            currentPage: page,
            totalPages,
            limit,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

async function addCoupon(req,res){
        const {
            code,
            discountAmount,
            discountType,
            maxDiscount,
            minOrderValue,
            expiresAt,
            usageLimit
        } = req.body.formData;

  try {
     const newCoupon = new Coupon({
         code,
           discountAmount,
                discountType,
                maxDiscount,
                minOrderValue,
                expiresAt,
                usageLimit
            });
    
            await newCoupon.save();
            return res.status(201).json({ success: true, message: 'Coupon created successfully!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Failed to create coupon. Please try again.' });
        }  
}

async function editCoupon(req, res) {
    const { id } = req.params; 
    const {
        code,
        discountAmount,
        discountType,
        maxDiscount,
        minOrderValue,
        expiresAt,
        usageLimit,
        isActive 
    } = req.body;

    try {
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            {
                code,
                discountAmount,
                discountType,
                maxDiscount,
                minOrderValue,
                expiresAt,
                usageLimit,
                isActive
            },
            { new: true, runValidators: true } 
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        return res.status(200).json({ success: true, message: 'Coupon updated successfully!', coupon: updatedCoupon });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to update coupon. Please try again.' });
    }
}

async function changeCouponStatus(req, res) {
    const { id } = req.params; 
    
    try {
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        coupon.isActive = !coupon.isActive; 
        await coupon.save();

        return res.status(200).json({
            success: true,
            message: 'Coupon status updated successfully!',
            active: coupon.isActive,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to update coupon status. Please try again.' });
    }
}

async function validateCoupon (req, res){
    const userId = req.session.user
    const { code, subtotal } = req.body;

    console.log(code, subtotal);
    
    try {
        const coupon = await Coupon.findOne({ code });
        const user = await User.findById(userId)

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        const usedCoupon = user.usedCoupons.find(currentCoupon => currentCoupon._id.toString()===coupon._id.toString())

        if(usedCoupon){
            return res.status(400).json({ success: false, message: 'You Already Used The Coupon' });
        }
        
        if (coupon.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon expired' });
        }

        if (coupon.usageLimit <= coupon.usedCount) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        if (subtotal < coupon.minOrderValue) {
            return res.status(400).json({ success: false, message: `Minimum order value of ₹${coupon.minOrderValue} required` });
        }

        let discount = coupon.discountAmount;
        if (coupon.discountType === 'percentage') {
            discount = Math.min((subtotal * coupon.discountAmount) / 100, coupon.maxDiscount);
        }
   
        if((subtotal/2) < discount ){
            return res.status(400).json({success : false , message:'Cannot apply coupon which has more than 50% discount of the cart' })
        }
        
        res.json({ success: true, discountAmount: discount });

        // coupon.usedCount += 1;
        await coupon.save();
    } catch (error) {
        console.error('Error validating coupon:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
module.exports = {
    getCoupons,addCoupon,validateCoupon,changeCouponStatus,editCoupon
}