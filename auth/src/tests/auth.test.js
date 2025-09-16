// src/tests/auth.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user.model');

jest.setTimeout(30000); // 30s for slow DB operations

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'test_secret';
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

describe('Auth Register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: { firstName: 'John', lastName: 'Doe' },
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('should return 409 if user with email already exists', async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: { firstName: 'John', lastName: 'Doe' },
      });
    expect(res.statusCode).toBe(409);
  });
});

describe('Auth Login', () => {
  beforeEach(async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await require('bcryptjs').hash('password123', 10),
      fullName: { firstName: 'John', lastName: 'Doe' },
    });
  });

  it('should log in an existing user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Auth /me', () => {
  let token;

  beforeEach(async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await require('bcryptjs').hash('password123', 10),
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    token = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
  });

  it('should return user data if authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Auth Logout', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({}); // Clear users before each test

    // Register and login a user to get a token
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'logoutuser',
        email: 'logout@example.com',
        password: 'password123',
        fullName: { firstName: 'Logout', lastName: 'User' },
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logout@example.com',
        password: 'password123',
      });
    
    // Extract the token from the set-cookie header
    const cookie = res.headers['set-cookie'][0];
    token = cookie.split(';')[0].split('=')[1];
  });

  it('should log out the user successfully', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
    expect(res.headers['set-cookie'][0]).toContain('token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'); // Check for cleared cookie
  });

  it('should return 200 even if not authenticated (no active session to clear)', async () => {
    const res = await request(app)
      .get('/api/auth/logout');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});
