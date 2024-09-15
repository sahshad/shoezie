function getLogin(req,res){
  res.render('admin/login')
}

function getHome(req,res){
  res.render('admin/dashboard')
}

function getUsers(req,res){
  res.render('admin/usersList')
}

function getProducts(req,res){
  res.render('admin/products')
}
function getCategory(req,res){
  res.render('admin/category')
}

module.exports={
  getLogin,getHome,getUsers,getProducts,getCategory
}