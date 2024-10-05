const Cart = require('../model/cart')
const User = require('../model/user')
const Address = require('../model/address')
const Product = require('../model/product')

async function getCart(req, res) {
    const userId = req.session.user;

    try {
        let cart = await Cart.findOne({ user: userId }).populate('products.productId')

        if (!cart) {
            const newCart = new Cart({
                user: userId,
                products: [],
            });
            await newCart.save();
            cart = newCart; 
        }

        res.render('user/cart', { cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
    }
}

async function getCheckout(req,res){
    const userId = req.session.user 
    const address = await Address.find({user:userId})
    const cart = await Cart.findOne({user:userId}).populate('products.productId')
 res.render('user/checkout',{address,cart})
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
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const size = product.sizes.find(size => size._id.toString() === sizeId);
        if (!size) {
            return res.status(404).json({ message: 'Size not found' });
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
            if (size.stock < productInCart.quantity) {
                return res.status(400).json({ message: `Only ${size.stock} items left` });
            }
            productInCart.quantity += quantity;
        } else {
            if (size.stock < quantity) {
                return res.status(400).json({ message: `Only ${size.stock} items left` });
            }
            cart.products.push({ productId, sizeId, quantity });
        }

        await cart.save();
        console.log(`Product added to cart: ${productId} with size ${sizeId}`);

        return res.status(200).json({ message: 'Product added to cart successfully' });
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
            return res.status(404).send({ message: 'User or cart not found' });
        }

        const result = await Cart.findOneAndUpdate(
            { _id: cart._id }, 
            { $pull: { products: { _id: productId } } },
            { new: true } 
        )

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
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).send({ message: 'User or cart not found' });
        }

        const cartItem = cart.products.find(p => p._id.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        const product = await Product.findById(cartItem.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const productSize = product.sizes.find(size => size._id.toString() === cartItem.sizeId.toString());
        if (!productSize) {
            return res.status(404).json({ message: 'Product size not found' });
        }

        if (quantity > productSize.stock) {
            return res.status(400).json({ message: 'Product stock limit reached' });
        }

        cartItem.quantity = quantity;
        await cart.save();
        res.status(200).json({ message: 'Product quantity updated successfully', cart: cart });
    } catch (error) {
        console.error('Error updating product quantity:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    getCart,getCheckout,addProductToCart,
    removeProductFromCart,updateProductQuantity
}