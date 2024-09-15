const User = require('../model/user')
function getLogin(req,res){
    res.render('user/login')
}

function getSignup(req,res){
    res.render('user/signup')
}

 async function addUser (req, res){
const {firstname,lastname,email,password} = req.body
    try {
        const newUser = new User({firstname,lastname, email, password });
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
}

module.exports ={
    getLogin,getSignup,addUser
}