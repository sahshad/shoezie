const express = require('express')
const router = express.Router()
const controller = require('../controller/userController')

router.get('/login',controller.getLogin)
router.get('/signup',controller.getSignup)
router.post('/register',controller.addUser)

module.exports = router