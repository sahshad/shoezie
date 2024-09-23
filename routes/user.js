const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin,getHome,getShop,getProduct,getProfile,userLogIn,userLogOut} = require('../controller/userController')
const { userAuthenticated} = require('../middleware/authMiddleware')

router.get('/login',getLogin)
router.post('/login',userLogIn)
router.post('/logout',userLogOut)

router.get('/signup',getSignup)
router.post('/register',addUser)
router.get('/profile',userAuthenticated,getProfile)

router.get('/home',getHome)
router.get('/shop',getShop)
router.get('/shop/:id',getProduct)

module.exports = router