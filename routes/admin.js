const express = require('express');
const router = express.Router();
const {
    getLogin, getHome, getUsers, getProducts, getCategory    
} = require('../controller/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/login', getLogin);
router.post('/login', getHome);
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard')    });
router.get('/users', isAuthenticated, getUsers);
router.get('/products', isAuthenticated, getProducts);
router.get('/category', isAuthenticated, getCategory);

module.exports = router;
