const request = require('supertest');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

jest.mock('../models/user');
const User = require('../models/user');

const authRoutes = require('../routes/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'testsecret',
  resave: false,
  saveUninitialized: true,
}));

app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should log in an existing user', async () => {
      const mockUser = {
        _id: '12345',
        email: 'testuser@example.com',
        password: await bcrypt.hash('password123', 10),
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');

      // Check that the session ID is set in the cookies
      expect(res.headers['set-cookie']).toBeDefined();

      // Optionally, parse the session ID if needed
      const cookies = res.headers['set-cookie'][0];
      expect(cookies).toMatch(/connect.sid/); // Ensure session cookie is present
    });

    it('should not log in with incorrect credentials', async () => {
      User.findOne.mockResolvedValue(null); // No user found

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'wronguser@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(400);
      expect(res.text).toBe('Invalid Email or Password');
    });
  });

  describe('GET /auth/logout', () => {
    it('should log out a user', async () => {
      const res = await request(app).get('/auth/logout');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
});
