
import { restoreCountdowns, addTodo, deleteTodo, toggleTodo, addedTodoToList, saveCountdownState, loadCountdownState, displayNoTasksMessage } from './script';
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const todosRouter = require('../routes/todos');
const Todo = require('../models/todo');

// Create a new express app
const app = express();
app.use(express.json());
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
}));
app.use('/todos', todosRouter);

let mongoServer;
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Todos API', () => {
    let userId;

    beforeEach(() => {
        // Generate a valid ObjectId for the fake user
        userId = 'fakeUser'
    });

    test('should fetch todos for logged-in user', async () => {
        await new Todo({
            description: 'Test todo',
            datetime: new Date(),
            owner: userId,
        }).save();

        app.use((req, res, next) => {
            req.session.userId = userId.toString();
            next();
        });

        const response = await request(app).get('/todos/get').expect(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].description).toBe('Test todo');
    });

    test('should add a new todo for logged-in user', async () => {
        app.use((req, res, next) => {
            req.session.userId = userId.toString();
            next();
        });

        const response = await request(app)
            .post('/todos')
            .send({
                description: 'New todo',
                datetime: new Date(),
            })
            .expect(201);

        expect(response.body.description).toBe('New todo');
    });

    test('should toggle a todo completed status', async () => {
        const todo = await new Todo({
            description: 'Todo to toggle',
            datetime: new Date(),
            owner: userId,
        }).save();

        app.use((req, res, next) => {
            req.session.userId = userId.toString();
            next();
        });

        const response = await request(app)
            .post(`/todos/toggle/${todo._id}`)
            .expect(200);

        expect(response.body.completed).toBe(true);
    });

    test('should delete a todo', async () => {
        const todo = await new Todo({
            description: 'Todo to delete',
            datetime: new Date(),
            owner: userId,
        }).save();

        app.use((req, res, next) => {
            req.session.userId = userId.toString();
            next();
        });

        await request(app).delete(`/todos/${todo._id}`).expect(200);

        const deletedTodo = await Todo.findById(todo._id);
        expect(deletedTodo).toBeNull();
    });

    test('should return 401 if not logged in', async () => {
        const response = await request(app).get('/todos/get').expect(401);
        expect(response.text).toBe('Please Singin to continue...');
    });
});
