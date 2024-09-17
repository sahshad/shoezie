const Admin = require('../model/admin');
const bcrypt = require('bcrypt');

function getLogin(req, res) {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.render('admin/login');
}

async function getHome(req, res) {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.send('User not found');
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            req.session.admin = admin.id;
            return res.redirect('/admin/dashboard');
        } else {
            return res.send('Invalid credentials'); 
        }
    } catch (error) {
        console.error(error);
        return res.send('An error occurred');
    }
}

function getUsers(req, res) {
    res.render('admin/usersList');
}
function getProducts(req, res) {
    res.render('admin/products');
}
function getCategory(req, res) {
    res.render('admin/category');
}

module.exports = {
    getLogin,
    getHome,
    getUsers,
    getProducts,
    getCategory
};
