const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin,getHome,getShop,getProduct,sortProducts,
userLogIn,verifyOtp,getOtpPage,resendOtp,forgotPassword,sendOtp,
forgotPasswordVerifyOtp,resetPassword,forgotPasswordResendOtp,
getAbout} = require('../controller/userController')

 const{getProfile,userLogOut,
    getAddress,getOrders,getOrderDetails,
    updateUserDetails,addAddress,
    updateAddress,deleteAddress,updatePassword } = require('../controller/userProfileController')   

const { userAuthenticated,preventCache} = require('../middleware/authMiddleware')

const {getCart,getCheckout,addProductToCart,
    removeProductFromCart,updateProductQuantity} = require('../controller/cartController')

const { createOrder,cancelOrder,updateOrderStatus,ordercreated,returnOrder,downloadInvoice,checkProduct} = require('../controller/orderController')

const {validateCoupon} = require('../controller/coupon')

const {getWallet} = require('../controller/wallet')

const {
getWishlist,
addProductToWishlist,
deleteProductFromWishlist
} = require('../controller/whishlistController')
const { StatusCodes } = require('http-status-codes')

router.get('/login',getLogin)
router.post('/login',preventCache,userLogIn)
router.get('/forgot-password',forgotPassword)
router.post('/forgot-password/send-otp',sendOtp)
router.post('/forgot-password/resend-otp',forgotPasswordResendOtp)
router.post('/forgot-password/verify-otp',forgotPasswordVerifyOtp)
router.post('/forgot-password/reset',resetPassword)

router.get('/profile',userAuthenticated,getProfile)
router.put('/profile/update',updateUserDetails)
router.patch('/profile/password/update',updatePassword)

router.get('/profile/address',userAuthenticated,getAddress)
router.post('/profile/address/add',addAddress)
router.post('/profile/address/update',updateAddress)
router.delete('/profile/address/delete/:addressId',deleteAddress)

router.get('/profile/orders',userAuthenticated,getOrders)
router.get('/profile/orders/:orderId',userAuthenticated,getOrderDetails)
router.patch('/profile/orders/cancel/:orderId',cancelOrder)
router.patch('/profile/order/repay/:orderId',updateOrderStatus)
router.get('/profile/order/repay/check-product/:orderId',checkProduct)
router.post('/profile/order/return/:orderId',returnOrder)
router.get('/profile/order/invoice/:orderId',downloadInvoice)

router.get('/signup',getSignup)
router.post('/register',addUser)
router.get('/verify-otp',getOtpPage)
router.post('/verify-otp',verifyOtp)
router.post('/resend-otp',resendOtp)

router.get('/',getHome)
router.get('/shop',getShop)
router.get('/shop/filter',sortProducts)
router.get('/shop/:id',getProduct)

router.get('/cart',userAuthenticated,getCart)
router.get('/cart/checkout',userAuthenticated,getCheckout)
router.post('/cart/checkout/confirm-order',createOrder)
router.patch('/cart/checkout/update-order/:orderId',updateOrderStatus)
router.get('/cart/checkout/order-created/:orderId',ordercreated)

router.post('/cart/add/:productId/:sizeId',addProductToCart)
router.delete('/cart/remove/:productId',removeProductFromCart)
router.put('/cart/update/:productId',updateProductQuantity)
router.post('/cart/coupon/validate',validateCoupon)

router.get('/wishlist',userAuthenticated,getWishlist)
router.post('/wishlist/add',addProductToWishlist)
router.delete('/wishlist/delete',deleteProductFromWishlist)

router.get('/profile/wallet',userAuthenticated,getWallet)
router.get('/about', getAbout)

router.get('/logout',userLogOut)

router.use((req, res) => {
    res.status(StatusCodes.NOT_FOUND).render('user/error', {
        message: 'Oops! The page you are looking for does not exist in the Users section.'
    });
});
module.exports = router