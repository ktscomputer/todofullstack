const express = require('express')
const mongoose = require('./database')
const dotenv =require('dotenv')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const path = require('path')
const authRoutes = require('./routes/auth')
const todoRoutes = require('./routes/todos')
const Todo = require('./models/todo')






const app = express()
const PORT = 3900 ;

app.set('view engine','ejs');
app.set('views' ,path.join(__dirname,'views'))

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')));


app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    store:MongoStore.create({mongoUrl:process.env.MONGO_URI})
}));

app.use(authRoutes);
app.use('/todos',todoRoutes);

app.get('/', async(req, res) => {
    if(!req.session.userId){
     return res.redirect('/login');
    }
    try{
        const todos = await Todo.find({owner:req.session.userId});
            res.render('index',{
                todos,
            userEmail:req.session.userEmail})
    }catch(err){
        console.error('not found tasks',err);
        if(!res.headersSent){
            res.status(500).send("Error finding Task")
        }
    }
});

app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/todos',async(req,res)=>{
    try{
    const todos = await Todo.find();
    res.status(200).json(todos);
}
catch(err){
    if(!res.headersSent){
    res.status(500).json({error:err.message})
}
}
})



// app.get('/',(req,res)=>{
//     res.render({userEmail:req.user.email, todos:Todo})
// })


app.get('/register',(req,res)=>{
    res.render("register")
})



app.listen(PORT,()=>{
    console.log(`Server Running on Port ${PORT}`)
})


