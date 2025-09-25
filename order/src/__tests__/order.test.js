const request = require('supertest');
const app = require('../app');
const Order = require('../models/order.model');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

describe('Order API', () => {
  let mongoServer;
  let agent;
  const userId = '68d522c48d5f6aeb1e25eba8';
  const JWT_SECRET = '51bbd9a9c5a317cb9298ea11cc01292c';

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
          shippingAddress: '123 Main St, Anytown, USA',
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
          shippingAddress: '123 Main St, Anytown, USA',
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
          shippingAddress: '123 Main St, Anytown, USA',
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
            shippingAddress: '123 Main St, Anytown, USA',
          });
  
        expect(response.status).toBe(401);
      });
  });
});