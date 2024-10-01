const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin,getHome,getShop,getProduct
    ,getProfile,userLogIn,userLogOut,getAddress,
    getOrderDetails,getOrders} = require('../controller/userController')

const { userAuthenticated} = require('../middleware/authMiddleware')

const {getCart,getCheckout,addProductToCart,
    removeProductFromCart,updateProductQuantity} = require('../controller/cartController')

router.get('/login',getLogin)
router.post('/login',userLogIn)

router.get('/profile',userAuthenticated,getProfile)
router.get('/profile/address',getAddress)
router.get('/profile/orders',getOrders)
router.get('/profile/orders/orderdetails',getOrderDetails)

router.get('/signup',getSignup)
router.post('/register',addUser)


router.get('/home',getHome)
router.get('/shop',getShop)
router.get('/shop/:id',getProduct)

router.get('/cart',userAuthenticated,getCart)
router.get('/cart/checkout',getCheckout)
router.post('/cart/add/:productId/:sizeId',addProductToCart)
router.delete('/cart/remove/:productId',removeProductFromCart)
router.put('/cart/update/:productId',updateProductQuantity)

router.get('/logout',userLogOut)
module.exports = router