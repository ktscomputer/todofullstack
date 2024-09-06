import request from 'supertest';
import { expect } from 'chai';
import app from '../index.js';

const PORT = 3900;

// Helper to clear the database before each test
const clearDatabase = async () => {
  // Assuming you have a Todo model
  await mongoose.connection.dropDatabase();
};

describe('Server Tests', function() {
  before(async function() {
    // Connect to the test database
    await mongoose.connect(process.env.MONGO_URI);
  });

  beforeEach(async function() {
    await clearDatabase();
  });

  after(async function() {
    await mongoose.connection.close();
  });

  describe('GET /login', function() {
    it('should render the login page', async function() {
      const res = await request(app).get('/login');
      expect(res.status).to.equal(200);
      expect(res.text).to.include('<form'); // You can adjust this based on what the login page contains
    });
  });

  describe('GET /register', function() {
    it('should render the register page', async function() {
      const res = await request(app).get('/register');
      expect(res.status).to.equal(200);
      expect(res.text).to.include('<form'); // Adjust based on the content
    });
  });

  describe('GET /todos', function() {
    it('should return all todos', async function() {
      // Add some todos to the database
      await Todo.create({ description: 'Test Todo', owner: 'testUser' });

      const res = await request(app).get('/todos');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.is.not.empty;
      expect(res.body[0]).to.have.property('description', 'Test Todo');
    });
  });

  // Additional tests for POST, DELETE, and PUT requests can be added similarly
});
