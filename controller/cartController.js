const Cart = require('../model/cart')
const User = require('../model/user')
const Product = require('../model/product')

async function getCart(req, res) {
    const userId = req.session.user;

    try {
        // Find the user and populate the cart
        const user = await User.findById(userId).populate({
            path: 'cart',
            populate: {
                path: 'products.productId',
                model: 'Product'
            }
        });

        // Check if the user has a cart
        if (!user.cart) {
            // If no cart exists, create a new one
            const newCart = await Cart.create({ products: [] });
            user.cart = newCart._id; // Assign the new cart ID to the user
            await user.save(); // Save the user with the new cart
        }

        // Re-fetch the user to ensure the cart is populated
        const updatedUser = await User.findById(userId).populate({
            path: 'cart',
            populate: {
                path: 'products.productId',
                model: 'Product'
            }
        });

        // Map the products to include size details
        const cart = updatedUser.cart.products.map(product => {
            const sizeDetails = product.productId.sizes.find(size => size._id.toString() === product.sizeId.toString());

            return {
                _id: product._id,
                productId: product.productId,
                sizeId: product.sizeId,
                quantity: product.quantity,
                sizeDetails // Include the size details in the cart item
            };
        });

        // Render the cart view
        res.render('user/cart', { cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}


function getCheckout(req,res){
 res.render('user/checkout')
}
async function addProductToCart(req, res) {
    const { productId, sizeId } = req.params;
    const userId = req.session.user;
    const quantity = 1;

    try {

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const product = await Product.findById(productId)

        if(!product){
         return res.status(404).json({message:'product not found'})
        }
 
        const size = product.sizes.find(size => size._id.toString() === sizeId)
 
        if(!size){
         return res.status(404).json({message:'size not found'})
        }
 
        // if(size.stock < quantity){
        //  return res.status(400).json({message:`only ${size.stock} items left`})
        // }
        // size.stock -=quantity
 
        // await product.save()

        let cart;
        if (user.cart) {
            cart = await Cart.findById(user.cart);
        } else {
            cart = new Cart();
            await cart.save();
            user.cart = cart._id;
            await user.save();
        }

        const productInCart = cart.products.find(p => 
            p.productId.toString() === productId && p.sizeId.toString() === sizeId
        );

        if(productInCart){

        if(size.stock <= productInCart.quantity){
         return res.status(400).json({message:`only ${size.stock} items left`})

        }
    }
        // Check if the product with the same productId and sizeId exists
        const productIndex = cart.products.findIndex(p => 
            p.productId.toString() === productId && p.sizeId.toString() === sizeId
        );
;

        if (productIndex > -1) {
            // If it exists, increase the quantity
            cart.products[productIndex].quantity += quantity;
        } else {
            // If it doesn't exist, add a new product to the cart
            cart.products.push({ productId, sizeId, quantity });
        }

        await cart.save();
        console.log(`Product added to cart: ${productId} with size ${sizeId}`);
        
        // Send a success response
        return res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to user cart:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

async function removeProductFromCart(req, res) {
    const { productId } = req.params;
    const userId = req.session.user; // Ensure user is authenticated

    try {
        const user = await User.findById(userId).populate('cart');

        // const cartItem =user.cart.products.find(size => size._id.toString() === productId)
        // console.log(cartItem.sizeId);

        // const product = await Product.findById(cartItem.productId)
        // const productSize = product.sizes.find(size => size._id.toString() === cartItem.sizeId.toString())

        //  productSize.stock += cartItem.quantity

        // await product.save()
        // Find the user and their cart
        if (!user || !user.cart) {
            return res.status(404).send({ message: 'User or cart not found' });
        }

        // Remove the product from the cart
        const result = await Cart.findOneAndUpdate(
            { _id: user.cart }, // Use the cart ID directly
            { $pull: { products: { _id:productId } } }, // Remove by productId
            { new: true } // Return the updated cart
        );

        if (result) {
            res.status(200).send({ message: 'Product removed from cart', cart: result });
        } else {
            res.status(404).send({ message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

async function updateProductQuantity(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.session.user;

    try {
        // Fetch the user and their cart
        const user = await User.findById(userId).populate('cart');
        if (!user || !user.cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the product in the user's cart
        const cartItem = user.cart.products.find(p => p._id.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        // Fetch the product from the Product collection
        const product = await Product.findById(cartItem.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find the specific size of the product
        const productSize = product.sizes.find(size => size._id.toString() === cartItem.sizeId.toString());
        if (!productSize) {
            return res.status(404).json({ message: 'Product size not found' });
        }

        // Check if the requested quantity exceeds the stock
        if (quantity > productSize.stock) {
            return res.status(400).json({ message: 'Product stock limit reached' });
        }

        // Update the quantity in the cart
        cartItem.quantity = quantity;

        // Save the updated cart (since subdocuments cannot be saved individually)
        await user.cart.save();

        res.status(200).json({ message: 'Product quantity updated successfully', cart: user.cart });
    } catch (error) {
        console.error('Error updating product quantity:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}



// async function updateProductQuantity(req,res){
//     const {productId} = req.params
//     const {quantity} = req.body
//     const userId = req.session.user;
//     try {
//         const user = await User.findById(userId).populate('cart');
//         const cartItem =user.cart.products.find(size => size._id.toString() === productId)

//         const product = await Product.findById(cartItem.productId)
//         const productSize = product.sizes.find(size => size._id.toString() === cartItem.sizeId.toString())

//         if(quantity > productSize.stock){
//            return  res.status(400).json({message:'product stock limit reached'})
//         }

//         cartItem.stock = quantity
//         console.log(cartItem.stock);
        
//        await user.cart.save()
        
//         res.status(201)
        
//     } catch (error) {
        
//     }
    
// }
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
    getCart,getCheckout,addProductToCart,
    removeProductFromCart,updateProductQuantity
}