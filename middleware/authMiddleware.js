
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
    res.redirect('/login')
}

function preventCache(req, res, next) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  }
module.exports = {
    isAuthenticated,userAuthenticated,preventCache
};
