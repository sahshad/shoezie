const express = require('express')
const router = express.Router()
const controller = require('../controller/adminController')

router.get('/login',controller.getLogin)
router.get('/dashboard',controller.getHome)
router.get('/users',controller.getUsers)
router.get('/products',controller.getProducts)
router.get('/category',controller.getCategory)
module.exports = router