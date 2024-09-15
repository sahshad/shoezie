const express = require('express')
const router = express.Router()
const {
     getLogin, getHome,getUsers,getProducts,getCategory    
} = require('../controller/adminController')


router.get('/login',getLogin)
router.get('/dashboard',getHome)
router.get('/users',getUsers)
router.get('/products',getProducts)
router.get('/category',getCategory)

module.exports = router