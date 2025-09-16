// src/tests/auth.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const express = require('express');
const cookieParser = require('cookie-parser');



app.use(express.json());
app.use(cookieParser()); // ← Make sure this is here

jest.setTimeout(30000);

let mongo;

// Setup in-memory Mongo
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  process.env.JWT_SECRET = 'test_secret';
});

// Cleanup
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

// Clear DB before each test
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Helper: register & login user, returns cookie token
const registerAndLogin = async (user = null) => {
  const userData = user || {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    fullName: { firstName: 'John', lastName: 'Doe' },
  };

  await request(app).post('/api/auth/register').send(userData);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });

  const cookie = res.headers['set-cookie'][0];
  const token = cookie.split(';')[0].split('=')[1];
  return token;
};

// -------------------- REGISTER --------------------
describe('Auth Register', () => {
  it('registers a user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('fails if required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
  });

  it('fails if user already exists', async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: { firstName: 'John', lastName: 'Doe' },
    });

    expect(res.statusCode).toBe(409);
  });
});

// -------------------- LOGIN --------------------
describe('Auth Login', () => {
  beforeEach(async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      fullName: { firstName: 'John', lastName: 'Doe' },
    });
  });

  it('logs in successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('fails if email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'password123' });
    expect(res.statusCode).toBe(400);
  });

  it('fails if password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(400);
  });
});

// -------------------- CURRENT USER --------------------
describe('Auth /me', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it('returns user data if authenticated', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('fails if unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// -------------------- LOGOUT --------------------
describe('Auth Logout', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin({ username: 'logoutuser', email: 'logout@example.com', password: 'password123', fullName: { firstName: 'Logout', lastName: 'User' } });
  });

  it('logs out successfully', async () => {
    const res = await request(app).get('/api/auth/logout').set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
    expect(res.headers['set-cookie'][0]).toContain('token=;');
  });

  it('returns 200 even if not logged in', async () => {
    const res = await request(app).get('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});

// -------------------- USER ADDRESSES --------------------
describe('User Addresses', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  it('adds an address', async () => {
    const res = await request(app).post('/api/auth/users/me/addresses')
      .set('Cookie', [`token=${token}`])
      .send({ street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' });

    expect(res.statusCode).toBe(200);
    expect(res.body.addresses[0]).toMatchObject({ street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' });
  });

  it('retrieves addresses', async () => {
    await request(app).post('/api/auth/users/me/addresses')
      .set('Cookie', [`token=${token}`])
      .send({ street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' });

    const res = await request(app).get('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0].street).toBe('123 Main St');
  });

  it('deletes an address', async () => {
    const addRes = await request(app).post('/api/auth/users/me/addresses')
      .set('Cookie', [`token=${token}`])
      .send({ street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' });

    const addressId = addRes.body.addresses[0]._id;
    const delRes = await request(app).delete(`/api/auth/users/me/addresses/${addressId}`)
      .set('Cookie', [`token=${token}`]);

    expect(delRes.statusCode).toBe(200);

    const getRes = await request(app).get('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]);
    expect(getRes.body).toEqual([]);
  });
});
