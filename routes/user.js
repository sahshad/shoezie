const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin,getHome,getShop,getProduct,
userLogIn} = require('../controller/userController')

 const{    getProfile,userLogOut,
    getAddress,getOrders,getOrderDetails,updateUserDetails,
    addAddress,updateAddress}= require('../controller/userProfileController')   

const { userAuthenticated} = require('../middleware/authMiddleware')

const {getCart,getCheckout,addProductToCart,
    removeProductFromCart,updateProductQuantity} = require('../controller/cartController')

router.get('/login',getLogin)
router.post('/login',userLogIn)

router.get('/profile',userAuthenticated,getProfile)
router.put('/profile/update',updateUserDetails)

router.get('/profile/address',getAddress)
router.post('/profile/address/add',addAddress)
router.post('/profile/address/update',updateAddress)

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