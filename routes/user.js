const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin,getHome,getShop,getProduct
    ,getProfile,userLogIn,userLogOut,getAddress,
    getOrderDetails,getOrders} = require('../controller/userController')

const { userAuthenticated} = require('../middleware/authMiddleware')

router.get('/login',getLogin)
router.post('/login',userLogIn)

router.get('/profile',userAuthenticated,getProfile)
router.get('/profile/address',getAddress)
router.get('/profile/orders',getOrders)
router.get('/profile/orders/orderdetails',getOrderDetails)

router.get('/signup',getSignup)
router.post('/register',addUser)
// router.post('/')


router.get('/home',getHome)
router.get('/shop',getShop)
router.get('/shop/:id',getProduct)


router.get('/logout',userLogOut)
module.exports = router