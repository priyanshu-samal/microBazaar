const request = require('supertest');
const app = require('../app');
const Order = require('../models/order.model');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const axios = require('axios');

jest.mock('axios');

describe('Order API', () => {
  let mongoServer;
  let agent;
  const userId = '68d522c48d5f6aeb1e25eba8';
  const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    agent = request.agent(app);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    const token = jwt.sign({ id: userId, role: 'user' }, JWT_SECRET);
    agent.jar.setCookie(`token=${token}`);
  });

  describe('POST /api/orders', () => {
    it('should create a new order with status "pending"', async () => {
      const response = await agent
        .post('/api/orders')
        .send({
          items: [
            {
              productId: '60d21b4667d0d8992e610c85',
              quantity: 2,
              price: 10,
            },
          ],
          shippingAddress: { street: '123 Main St, Anytown, USA' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should compute taxes and shipping', async () => {
      const response = await agent
        .post('/api/orders')
        .send({
          items: [
            {
              productId: '60d21b4667d0d8992e610c85',
              quantity: 2,
              price: 10,
            },
          ],
          shippingAddress: { street: '123 Main St, Anytown, USA' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('taxPrice');
      expect(response.body).toHaveProperty('shippingPrice');
      expect(response.body.taxPrice).toBeGreaterThan(0);
      expect(response.body.shippingPrice).toBeGreaterThan(0);
    });

    it('should reserve inventory', async () => {
      // This test would require mocking the inventory service
      // and is left as a placeholder.
    });

    it('should return 400 if items are not in the cart', async () => {
      const response = await agent
        .post('/api/orders')
        .send({
          items: [],
          shippingAddress: { street: '123 Main St, Anytown, USA' },
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 if user is not authenticated', async () => {
        const unauthenticatedAgent = request.agent(app);
        const response = await unauthenticatedAgent
          .post('/api/orders')
          .send({
            items: [
              {
                productId: '60d21b4667d0d8992e610c85',
                quantity: 2,
                price: 10,
              },
            ],
            shippingAddress: { street: '123 Main St, Anytown, USA' },
          });
  
        expect(response.status).toBe(401);
      });

    it('creates order from current cart: computes totals and sets status pending', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('http://127.0.0.1:3002/api/cart')) {
          return Promise.resolve({
            data: {
              cart: {
                items: [
                  { productId: '60d21b4667d0d8992e610c85', quantity: 2 },
                  { productId: '60d21b4967d0d8992e610c86', quantity: 1 },
                ],
              },
            },
          });
        }
        if (url.includes('http://127.0.0.1:3001/api/products/60d21b4667d0d8992e610c85')) {
          return Promise.resolve({
            data: {
              _id: '60d21b4667d0d8992e610c85',
              stock: 10,
              price: { amount: 100, currency: 'INR' },
            },
          });
        }
        if (url.includes('http://127.0.0.1:3001/api/products/60d21b4967d0d8992e610c86')) {
          return Promise.resolve({
            data: {
              _id: '60d21b4967d0d8992e610c86',
              stock: 5,
              price: { amount: 50, currency: 'INR' },
            },
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      axios.post = jest.fn().mockResolvedValue({ data: { reserved: true } });

      const response = await agent
        .post('/api/orders')
        .send({
          // no items -> should pull from current cart
          shippingAddress: { street: '221B Baker Street, London' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('taxPrice');
      expect(response.body).toHaveProperty('shippingPrice');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('returns 400 when cart is empty (no items in cart service)', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('http://127.0.0.1:3002/api/cart')) {
          return Promise.resolve({ data: { cart: { items: [] } } });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const response = await agent
        .post('/api/orders')
        .send({
          // no items in request; relies on cart
          shippingAddress: { street: '123 Main St' },
        });

      expect(response.status).toBe(400);
    });

    it('returns 422 when shipping address is missing/invalid', async () => {
      // invalid type for nested field should fail validation layer
      const response = await agent
        .post('/api/orders')
        .send({
          items: [
            { productId: '60d21b4667d0d8992e610c85', quantity: 1, price: 10 },
          ],
          shippingAddress: { street: 123 },
        });

      expect(response.status).toBe(422);
    });

    it('returns 408 when inventory reservation fails', async () => {
      axios.get.mockResolvedValueOnce({
        data: { cart: { items: [{ productId: '60d21b4667d0d8992e610c85', quantity: 1 }] } },
      });
      axios.get.mockResolvedValueOnce({
        data: { _id: '60d21b4667d0d8992e610c85', stock: 10, price: { amount: 100, currency: 'INR' } },
      });
      axios.post = jest.fn().mockRejectedValue(new Error('reservation timeout'));

      const response = await agent
        .post('/api/orders')
        .send({ shippingAddress: { street: 'Some Address' } });

      expect(response.status).toBe(408);
    });
  });
});