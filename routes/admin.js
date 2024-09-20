const express = require('express');
const router = express.Router();
const {
    getLogin, getHome, getUsers,changeStatus,
} = require('../controller/adminController');
const { getProducts,addProduct,upload,deleteProduct,editProduct } = require('../controller/productController')
const {getCategory} = require('../controller/categoryController')
const { isAuthenticated } = require('../middleware/authMiddleware');


router.get('/login', getLogin);
router.post('/login', getHome);

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard')    });

router.get('/users', isAuthenticated, getUsers);
router.post('/users/:userId/:action',changeStatus)

router.get('/products', isAuthenticated, getProducts);
router.post('/products/add',upload,addProduct)
router.post('/products/edit',upload,editProduct)
router.delete('/products/delete/:id',deleteProduct)
router.get('/category', isAuthenticated, getCategory);

module.exports = router;
