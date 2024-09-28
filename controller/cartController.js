const Cart = require('../model/cart')
const User = require('../model/user')

async function getCart(req,res){
    const userId = req.session.user
    const user = await User.findById(userId).populate({
        path: 'cart',
        populate: {
            path: 'products.productId',
            model: 'Product'
        }
    });
    const cart = user.cart.products;
    console.log(cart);
    
    res.render('user/cart',{cart})
}

function getCheckout(req,res){
 res.render('user/checkout')
}
async function addProductToCart(req, res) {
    const { productId } = req.params;
    const userId = req.session.user;
    const quantity = 1;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let cart;
        if (user.cart) {
            cart = await Cart.findById(user.cart);
        } else {
            cart = new Cart();
            await cart.save();
            user.cart = cart._id;
            await user.save();
        }

        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

        if (productIndex > -1) {
            cart.products[productIndex].quantity += quantity;
        } else {
            cart.products.push({ productId, quantity });
        }

        await cart.save();
        console.log(`Product added to cart: ${productId}`);
        
        // Send a success response
        return res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to user cart:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// async function addProductToCart(req,res){
//     const {productId}=req.params
//     const userId = req.session.user
//     const quantity=1
//     try {
//         const user = await User.findById(userId);      
//         if (!user) {
//             throw new Error('User not found');
//         }
//         let cart;
//         if (user.cart) {
//             cart = await Cart.findById(user.cart);
//         } else {
//             cart = new Cart();
//             await cart.save();
//             user.cart = cart._id;
//             await user.save();
//         }
//         const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

//         if (productIndex > -1) {
//             cart.products[productIndex].quantity += quantity;
//         } else {
//             cart.products.push({ productId, quantity });
//         }
//         await cart.save();
//         console.log(`Product added to cart: ${productId}`);
//     } catch (error) {
//         console.error('Error adding product to user cart:', error);
//     }     
// }

module.exports = {
    getCart,getCheckout,addProductToCart
}