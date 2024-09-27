const Admin = require('../model/admin');
const User = require('../model/user')
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

async function getUsers(req, res) {
    const user = await User.find()  
    res.render('admin/usersList',{user});
}

async function changeUserStatus(req,res){

const { action, id } = req.params;
    
    try {
        const newStatus = action === 'list'; // Set status based on action
        const result=await User.findByIdAndUpdate(id, { isBlock: newStatus });
        if(result)
        res.status(200).json({ message: `User ${action === 'list' ? 'listed' : 'unlisted'} successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling product status.', error });
    }
}

function getLogout(req,res){
    req.session.destroy( err =>{
        if(err){
            console.log(err);
            res.redirect('/')
        }else{
            res.redirect('/admin/login')
        }
    })
}

module.exports = {
    getLogin,
    getHome,
    getUsers,
    changeUserStatus,
    getLogout
};
