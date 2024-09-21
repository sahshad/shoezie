const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin,getHome,getShop} = require('../controller/userController')

router.get('/login',getLogin)
router.get('/signup',getSignup)
router.post('/register',addUser)
router.get('/home',getHome)
router.get('/shop',getShop)

module.exports = router