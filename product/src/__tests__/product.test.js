require('dotenv').config();
const app = require('../app');
const supertest = require('supertest');
const mongoose = require('mongoose');
const Product = require('../models/product.model');

// Mock the auth middleware
jest.mock('../middleware/auth.middleware', () => () => (req, res, next) => {
  req.user = { id: '60d5ec49e03e8a2a4c9d0f1b', role: 'seller' }; // Using a valid ObjectId string
  next();
});

describe('Product API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  it('should create a new product', async () => {
    const response = await supertest(app)
      .post('/api/products')
      .field('title', 'Test Product')
      .field('description', 'Test Description')
      .field('priceAmount', '100')
      .field('priceCurrency', 'INR');

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Product');
  });

  it('should return 400 for missing title', async () => {
    const response = await supertest(app)
      .post('/api/products')
      .field('description', 'Test Description')
      .field('priceAmount', '100')
      .field('priceCurrency', 'INR');

    expect(response.status).toBe(400);
  });
});