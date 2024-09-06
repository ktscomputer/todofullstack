const express = require('express');
const User = require('../models/user')
const bcrypt = require('bcryptjs')

const router = express.Router();

 // ### User Registration ###

router.post('/register',async(req,res)=>{
    try{
        const {email,password} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).send("Email already Registred")
        }
        const user = new User({email,password})
        await user.save()
        req.session.userId = user._id;
        res.status(201).send("Email Registred Successfully")
    }catch(err){
        res.status(500).send(err.message)
    }
});

// ### User LogIn ###

router.post('/login',async(req,res)=>{
    try{
    const {email,password}= req.body;
    const user = await User.findOne({email});
    if(!user || !(await bcrypt.compare(password,user.password))){
        return res.status(400).send('Invalid Email or Password')
    }
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    return res.redirect('/')
    res.status(200).send('Login Successful');
    }catch(err){
        res.status(500).send(err.message);
    }
});


// ### User Logout ###

router.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/login')
    });
});

module.exports = router;
