const express = require('express');
const router = express.Router();

const {
    getLogin, getHome, getUsers,changeUserStatus,getLogout
} = require('../controller/adminController');

const { getProducts,addProduct,addUpload,editUpload,
    editProduct,changeProductStatus } = require('../controller/productController')

const {getCategory,addCategory,uploadCategory,changeCategoryStatus,editCategory} = require('../controller/categoryController')

const { isAuthenticated,preventCache } = require('../middleware/authMiddleware');

const {getAllOrders,changeOrderStatus,viewOrder} = require('../controller/orderController')

const {getCoupons,addCoupon} = require('../controller/coupon')

const {getOffers,createOffer,changeOfferStatus} = require('../controller/offers')

router.get('/login', getLogin);
router.post('/login', getHome);

router.get('/dashboard',preventCache, isAuthenticated, (req, res) => {
    res.render('admin/dashboard')});

router.get('/users',preventCache, isAuthenticated, getUsers);
router.patch('/users/:action/:id',changeUserStatus)

router.get('/products',preventCache,isAuthenticated,  getProducts);
router.post('/products/add',addUpload,addProduct)
router.post('/products/edit',editUpload,editProduct)
router.patch('/products/:action/:id',changeProductStatus)

router.get('/category',preventCache, isAuthenticated, getCategory);
router.post('/category/add',uploadCategory,addCategory)
router.put('/category/edit/:id',uploadCategory,editCategory)
router.patch('/category/:action/:id',changeCategoryStatus)

router.get('/orders',preventCache,isAuthenticated,getAllOrders)
router.get('/orders/view/:orderId',preventCache,isAuthenticated,viewOrder)
router.patch('/orders/status/:orderId',changeOrderStatus)

router.get('/coupons',getCoupons)
router.post('/coupons/create',addCoupon)

router.get('/offers',getOffers)
router.post('/offers/create',createOffer)
router.put('/offers/:status/:id',changeOfferStatus)

router.get('/logout',getLogout)

module.exports = router;
