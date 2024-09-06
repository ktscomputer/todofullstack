const express = require('express');
const Todo = require('../models/todo')

const router = express.Router();

function loggedIn(req,res,next){
    if(!req.session.userId){
        return res.status(401).send('Please Singin to continue...')
    }
    next();
}

router.get('/get',loggedIn, async(req,res)=>{
    try{
        const todos = await Todo.find({owner:req.session.userId});
        res.json(todos);
    }catch(err){
        res.status(500).send('Internal server error')
    }
});



router.post('/',loggedIn, async(req,res)=>{
    try{
    const {description,datetime} = req.body;
    
    if(!description){
        return res.status(400).send("All field required")
    }
    const existingTask = await Todo.findOne({ description,owner:req.session.userId });
    if (existingTask) {
        return res.status(400).json({ error: 'Task with this description already exists' });
    }
    const newTodo = new Todo({
        description ,
        datetime,
        owner:req.session.userId,
    });
    await newTodo.save()
    res.status(201).json(newTodo)
}catch(err){
    console.error('Failed to add todo:', err.message);
    res.status(500).json({ error: 'Failed to add todo' });
}
})

router.post('/toggle/:id',loggedIn,async(req,res)=>{
    try{
        const todo = await Todo.findById(req.params.id);
        if(!todo){
            return res.status(404).send('No Tasks Found')
        }
        todo.completed = !todo.completed;
        await todo.save()
        res.json(todo)
    }catch(err){
        res.status(500).send("Error toggling todo")
    }
});

router.delete('/:id',loggedIn,async(req,res)=>{
    try{
    const result = await Todo.findByIdAndDelete(req.params.id);
    if(!result){
        return res.status(404).send('Task not find')
    }
    res.status(200).send({message:"Task Deleted Successfully"})
    }catch(err){
        res.status(500).send("Error in deleting Task")
    }   
});

module.exports = router;