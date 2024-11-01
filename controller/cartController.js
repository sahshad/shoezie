const Cart = require('../model/cart')
const User = require('../model/user')
const Address = require('../model/address')
const Product = require('../model/product')
const Category = require('../model/category')
const { getBestOffer } = require('../utils/offerUtils')

// async function getCart(req, res) {
//     const userId = req.session.user;

//     try {
//         let cart = await Cart.findOne({ user: userId }).populate({path:'products.productId',populate:{path:'offers'}})     

//         if (!cart) {
//             const newCart = new Cart({
//                 user: userId,
//                 products: [],
//             });
//             await newCart.save();
//             cart = newCart; 
//         }

//         res.render('user/cart', { cart });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: 'Server error' });
//     }
// }

async function getCart(req, res) {
    const userId = req.session.user;

    try {
        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'products.productId',
                populate: { path: 'offers' }, 
            });

        if (!cart) {
            const newCart = new Cart({
                user: userId,
                products: [],
            });
            await newCart.save();
            cart = newCart;
        }

        const productsWithBestOffers = await Promise.all(
            cart.products.map(async (item) => {
                const product = item.productId;

                const category = await Category.findById(product.category).populate('offers')
                const categoryOffers = category ? category.offers : [];

                const combinedOffers = [...product.offers, ...categoryOffers];       
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
                    ...item.toObject(),
                    bestOffer, 
                };
            })
        );
        res.render('user/cart', { cart: { ...cart.toObject(), products: productsWithBestOffers}});
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send({ message: 'Server error' });
    }
}

async function getCheckout(req,res){
    const userId = req.session.user 
    const address = await Address.find({user:userId})
const cart = await Cart.findOne({user:userId})
.populate({path:'products.productId',
    populate:{path :'offers'}
})

cart.products.forEach(product => {
     const productSize =  product.productId.sizes.find(size => size._id.toString() === product.sizeId.toString())
     if(productSize.stock === 0){
        return res.redirect('/user/cart')
     }
})

const productsWithBestOffers = await Promise.all(
    cart.products.map(async (item) => {
        const product = item.productId;
        
        const category = await Category.findById(product.category).populate('offers')
        const categoryOffers = category ? category.offers : [];

        const combinedOffers = [...product.offers, ...categoryOffers];       
        // const hasValidOffer = combinedOffers.some(offer => offer.minProductPrice >= product.price);

        //     let bestOffer = null;

        //     if (!hasValidOffer) {
        //         bestOffer = await getBestOffer(combinedOffers, product.price);
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
        return {
            ...item.toObject(),
            bestOffer, 
        };
    })
);

 res.render('user/checkout',{address,cart: { ...cart.toObject(), products: productsWithBestOffers }})
}


async function addProductToCart(req, res) {
    const { productId, sizeId } = req.params;
    const userId = req.session.user;
    console.log(sizeId);
    
    const quantity = 1;
    try {
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!user) {
            return res.status(404).json({success:false, message: 'You are not loged in. Please Login' });
        }
        if (!product) {
            return res.status(404).json({success:false, message: 'Product not found' });
        }
       
        const size = product.sizes.find(size => size._id.toString() === sizeId);
        if (!size) {
            return res.status(404).json({success:false, message: 'Size not found' });
        }

       let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            const newCart = new Cart({
                user: userId,
                products: [],
            });
            await newCart.save();
            cart = newCart; 
        }

        const productInCart = cart.products.find(p => 
            p.productId.toString() === productId && p.sizeId.toString() === sizeId
        );

        if (productInCart) {
            if (size.stock <= productInCart.quantity) {
                return res.status(400).json({success:false, message: `You already have ${size.stock} in your cart` });
            }
            productInCart.quantity += quantity;
        } else {
            if (size.stock < quantity) {
                return res.status(400).json({success:false, message: `Only ${size.stock} items left` });
            }
            cart.products.push({ productId, sizeId, quantity });
        }

        await cart.save();
        console.log(`Product added to cart: ${productId} with size ${sizeId}`);

        return res.status(200).json({ success:true, message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to user cart:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

async function removeProductFromCart(req, res) {
    const { productId } = req.params; 
    const userId = req.session.user; 

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({succes:false, message: 'User or cart not found' });
        }

        const result = await Cart.findOneAndUpdate(
            { _id: cart._id }, 
            { $pull: { products: { _id: productId } } },
            { new: true } 
        )

        if (result) {
           return res.status(200).json({success:true, message: 'Product removed from cart' });
        } else {
            return res.status(404).json({success:false, message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

async function updateProductQuantity(req,res) {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.session.user;

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({success:false, message: 'User or cart not found' });
        }

        const cartItem = cart.products.find(p => p._id.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({success:false, message: 'Product not found in cart' });
        }

        const product = await Product.findById(cartItem.productId);
        if (!product) {
            return res.status(404).json({success:false, message: 'Product not found' });
        }

        const productSize = product.sizes.find(size => size._id.toString() === cartItem.sizeId.toString());
        if (!productSize) {
            return res.status(404).json({success:false, message: 'Product size not found' });
        }

        if (quantity > productSize.stock) {
            return res.status(400).json({success:false, message: 'Product stock limit reached' });
        }

        cartItem.quantity = quantity;
        await cart.save();
       return res.status(200).json({success:true, message: ' quantity updated successfully', cart: cart });
    } catch (error) {
        console.error('Error updating product quantity:', error);
        res.status(500).json({success:false, message: 'Internal Server Error' });
    }
}

module.exports = {
    getCart,getCheckout,addProductToCart,
    removeProductFromCart,updateProductQuantity
}