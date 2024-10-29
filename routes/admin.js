const express = require('express');
const router = express.Router();

const {
    getLogin, getHome, getUsers,changeUserStatus,getLogout , getDashboard
} = require('../controller/adminController');

const { getProducts,addProduct,addUpload,editUpload,
    editProduct,changeProductStatus } = require('../controller/productController')

const {getCategory,addCategory,uploadCategory,changeCategoryStatus,editCategory} = require('../controller/categoryController')

const { isAuthenticated,preventCache } = require('../middleware/authMiddleware');

const {getAllOrders,changeOrderStatus,viewOrder,takeReturnAction} = require('../controller/orderController')

const { getCoupons,addCoupon, editCoupon,changeCouponStatus } = require('../controller/coupon')

const { getOffers,createOffer,changeOfferStatus,editOffer } = require('../controller/offers');

const { getSalesReport,getCustomSalesReport,downloadSalesReport } = require('../controller/salesReport');

router.get('/login', getLogin);
router.post('/login', getHome);

router.get('/dashboard',preventCache, isAuthenticated,getDashboard);

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
router.patch('/orders/return/:orderId',takeReturnAction)

router.get('/coupons',isAuthenticated,getCoupons)
router.post('/coupons/create',addCoupon)
router.patch('/coupons/:status/:id',changeCouponStatus)
router.put('/coupons/update/:id',editCoupon)

router.get('/offers',isAuthenticated,getOffers)
router.post('/offers/create',createOffer)
router.patch('/offers/:status/:id',changeOfferStatus)
router.put('/offers/update/:id',editOffer)

router.get('/sales-report',isAuthenticated,getSalesReport)
router.post('/sales-report/:reportType',getCustomSalesReport)
router.get('/sales-report/download',isAuthenticated,downloadSalesReport)

router.get('/logout',getLogout)

module.exports = router;
