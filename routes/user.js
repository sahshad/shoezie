const express = require('express')
const router = express.Router()
const {addUser,getSignup,getLogin} = require('../controller/userController')

router.get('/login',getLogin)
router.get('/signup',getSignup)
router.post('/register',addUser)

module.exports = router