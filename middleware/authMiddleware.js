
function isAuthenticated(req, res, next) {
    if (req.session.admin) {
        return next();  
    }
    res.redirect('/admin/login') 
}

function userAuthenticated(req,res,next){
    if(req.session.user){
        return next()
    }
    if(req.isAuthenticated()){
       return next()
    }
    res.redirect('/user/login')
}

module.exports = {
    isAuthenticated,userAuthenticated
};
