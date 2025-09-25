require('dotenv').config();
const app = require('../app');
const supertest = require('supertest');
const mongoose = require('mongoose');
const Product = require('../models/product.model');

let mockUser = { id: '60d5ec49e03e8a2a4c9d0f1b', role: 'seller' };

jest.mock('../middleware/auth.middleware', () => {
  return jest.fn((roles) => (req, res, next) => {
    if (!roles.includes(mockUser.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = mockUser;
    next();
  });
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

  beforeEach(() => {
    mockUser = { id: '60d5ec49e03e8a2a4c9d0f1b', role: 'seller' };
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

  it('should not allow a customer to create a product', async () => {
    mockUser.role = 'customer';

    const response = await supertest(app)
      .post('/api/products')
      .field('title', 'Test Product')
      .field('description', 'Test Description')
      .field('priceAmount', '100')
      .field('priceCurrency', 'INR');

    expect(response.status).toBe(403);
  });

  it('should return 400 for missing title', async () => {
    const response = await supertest(app)
      .post('/api/products')
      .field('description', 'Test Description')
      .field('priceAmount', '100')
      .field('priceCurrency', 'INR');

    expect(response.status).toBe(400);
  });

  it('should get all products', async () => {
    // Create a product to ensure there is at least one product in the database
    await supertest(app)
      .post('/api/products')
      .field('title', 'Test Product')
      .field('description', 'Test Description')
      .field('priceAmount', '100')
      .field('priceCurrency', 'INR');

    const response = await supertest(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should get a single product by id', async () => {
    const product = await Product.create({
      title: 'Test Product',
      description: 'Test Description',
      price: {
        amount: 100,
        currency: 'INR'
      },
      seller: '60d5ec49e03e8a2a4c9d0f1b'
    });

    const response = await supertest(app).get(`/api/products/${product._id}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Test Product');
  });

  it('should return 404 for non-existent product id', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await supertest(app).get(`/api/products/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid product id', async () => {
    const invalidId = 'invalid-id';
    const response = await supertest(app).get(`/api/products/${invalidId}`);
    expect(response.status).toBe(400);
  });

  describe('PATCH /api/products/:id', () => {
    it('should allow a seller to update their own product', async () => {
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: new mongoose.Types.ObjectId(mockUser.id)
      });

      const response = await supertest(app)
        .patch(`/api/products/${product._id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });

    it('should not allow a seller to update a product they do not own', async () => {
      const otherSellerId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: otherSellerId
      });

      const response = await supertest(app)
        .patch(`/api/products/${product._id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });

    it('should not allow a customer to update any product', async () => {
      mockUser.role = 'customer';
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: new mongoose.Types.ObjectId(mockUser.id)
      });

      const response = await supertest(app)
        .patch(`/api/products/${product._id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent product id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await supertest(app)
        .patch(`/api/products/${nonExistentId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid data', async () => {
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: new mongoose.Types.ObjectId(mockUser.id)
      });

      const response = await supertest(app)
        .patch(`/api/products/${product._id}`)
        .send({ price: { amount: -10 } });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should allow a seller to delete their own product', async () => {
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: new mongoose.Types.ObjectId(mockUser.id)
      });

      const response = await supertest(app).delete(`/api/products/${product._id}`);

      expect(response.status).toBe(204);
    });

    it('should not allow a seller to delete a product they do not own', async () => {
      const otherSellerId = new mongoose.Types.ObjectId();
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: otherSellerId
      });

      const response = await supertest(app).delete(`/api/products/${product._id}`);

      expect(response.status).toBe(404);
    });

    it('should not allow a customer to delete any product', async () => {
      mockUser.role = 'customer';
      const product = await Product.create({
        title: 'Test Product',
        description: 'Test Description',
        price: {
          amount: 100,
          currency: 'INR'
        },
        seller: new mongoose.Types.ObjectId(mockUser.id)
      });

      const response = await supertest(app).delete(`/api/products/${product._id}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent product id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await supertest(app).delete(`/api/products/${nonExistentId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid product id', async () => {
      const invalidId = 'invalid-id';
      const response = await supertest(app).delete(`/api/products/${invalidId}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/products/seller', () => {
    it('should return a list of products for the logged-in seller', async () => {
      await Product.create([
        { title: 'Product 1', description: 'Description 1', price: { amount: 100, currency: 'INR' }, seller: new mongoose.Types.ObjectId(mockUser.id) },
        { title: 'Product 2', description: 'Description 2', price: { amount: 200, currency: 'INR' }, seller: new mongoose.Types.ObjectId(mockUser.id) },
        { title: 'Product 3', description: 'Description 3', price: { amount: 300, currency: 'INR' }, seller: new mongoose.Types.ObjectId() }, // Different seller
      ]);

      const response = await supertest(app).get('/api/products/seller');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body.every(p => p.seller.toString() === mockUser.id)).toBe(true);
    });

    it('should not allow a customer to access this endpoint', async () => {
      mockUser.role = 'customer';

      const response = await supertest(app).get('/api/products/seller');

      expect(response.status).toBe(403);
    });
  });
});