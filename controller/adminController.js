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

async function changeStatus(req,res){
  const { userId, action } = req.params;

  if (action !== 'block' && action !== 'unblock') {
  return res.status(400).json({ message: 'Invalid action. Use "block" or "unblock".' });
  }
  try {
      const update = action === 'block' ? { isBlock: true } : { isBlock: false };

      const result = await User.findByIdAndUpdate(userId, update, { new: true });

      if (result) {
          res.json({ message: `User ${userId} has been ${action}ed.` });
      } else {
          res.status(404).json({ message: 'User not found.' });
      }
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'An error occurred while processing the request.' });
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
    changeStatus,
    getLogout
};
