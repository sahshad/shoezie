const express = require('express')
const path= require('path')
const app = express()
const session = require('express-session')
const userRoute = require('./routes/user')
const adminRoute = require('./routes/admin')
const db =require('./config/db')
const passport = require('passport')
require('./passport');

require('dotenv').config()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')))
app.use(session({
    secret:'key',
    resave:false,
    saveUninitialized:false,
    cookie:{secure:false}
}))

db()

app.use('/user',userRoute)
app.use('/admin',adminRoute)
app.use('/auth',require('./routes/auth'))



const PORT = process.env.PORT
app.listen(PORT,()=>{console.log(`server running on ${PORT}`)})