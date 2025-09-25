const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Cart = require('../src/models/cart.model');

// Mock the auth middleware
jest.mock('../src/middleware/auth.middleware', () => jest.fn((roles) => (req, res, next) => {
  if (req.headers.authorization === 'bearer valid-token-user') {
    req.user = { id: '60d21b4667d0d8992e610c85', role: 'user' };
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.headers.authorization === 'bearer valid-token-admin') {
    req.user = { id: '60d21b4667d0d8992e610c86', role: 'admin' };
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}));

describe('Cart API', () => {
  let productId = '60d21b4667d0d8992e610c86'; // Hardcoded valid ObjectId
  let qty = 1;
  let userId = '60d21b4667d0d8992e610c85';

  afterEach(async () => {
    await Cart.deleteMany({});
  });

  // Test for POST /api/cart/items
  describe('POST /api/cart/items', () => {
    it('should create a new cart and add the first item', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer valid-token-user') // Mock token
        .send({ productId, qty });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('items');
      const addedItem = res.body.items.find(item => item.productId === productId);
      expect(addedItem).toBeDefined();
      expect(addedItem).toHaveProperty('quantity', qty);
    });

    it('should increment quantity when item already exists', async () => {
      // Add item once
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer valid-token-user')
        .send({ productId, qty });

      // Add same item again
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer valid-token-user')
        .send({ productId, qty });

      expect(res.statusCode).toEqual(201);
      expect(res.body.items.length).toEqual(1);
      expect(res.body.items[0].quantity).toEqual(qty * 2);
    });

    it('should return a validation error for invalid productId', async () => {
        const res = await request(app)
            .post('/api/cart/items')
            .set('Authorization', 'bearer valid-token-user')
            .send({ productId: 'invalid-id', qty: 1 });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should return a validation error for non-positive quantity', async () => {
        const res = await request(app)
            .post('/api/cart/items')
            .set('Authorization', 'bearer valid-token-user')
            .send({ productId, qty: 0 });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .send({ productId, qty });
      expect(res.statusCode).toEqual(401);
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer invalid-token')
        .send({ productId, qty });
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 for when role not allowed', async () => {
        const res = await request(app)
            .post('/api/cart/items')
            .set('Authorization', 'bearer valid-token-admin')
            .send({ productId, qty });

        expect(res.statusCode).toEqual(403);
    });
  });

  // Test for PATCH /api/cart/items/:productId
  describe('PATCH /api/cart/items/:productId', () => {
    beforeEach(async () => {
      // Add an item to the cart before each test
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer valid-token-user')
        .send({ productId, qty });
    });

    it('should update the quantity of an item in the cart', async () => {
      const newQty = 5;
      const res = await request(app)
        .patch(`/api/cart/items/${productId}`)
        .set('Authorization', 'bearer valid-token-user')
        .send({ qty: newQty });

      expect(res.statusCode).toEqual(200);
      expect(res.body.items[0].quantity).toEqual(newQty);
    });

    it('should return a validation error for non-positive quantity', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId}`)
        .set('Authorization', 'bearer valid-token-user')
        .send({ qty: 0 });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 404 if the item is not in the cart', async () => {
      const nonExistentProductId = '60d21b4667d0d8992e610c87';
      const res = await request(app)
        .patch(`/api/cart/items/${nonExistentProductId}`)
        .set('Authorization', 'bearer valid-token-user')
        .send({ qty: 5 });

      expect(res.statusCode).toEqual(404);
    });

    it('should return a validation error for invalid productId in URL', async () => {
      const res = await request(app)
        .patch('/api/cart/items/invalid-id')
        .set('Authorization', 'bearer valid-token-user')
        .send({ qty: 5 });

      expect(res.statusCode).toEqual(400);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId}`)
        .send({ qty: 5 });

      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if role is not allowed', async () => {
      const res = await request(app)
        .patch(`/api/cart/items/${productId}`)
        .set('Authorization', 'bearer valid-token-admin')
        .send({ qty: 5 });

      expect(res.statusCode).toEqual(403);
    });
  });

  // Test for DELETE /api/cart/items/:productId
  describe('DELETE /api/cart/items/:productId', () => {
    beforeEach(async () => {
      // Add an item to the cart before each test
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer valid-token-user')
        .send({ productId, qty });
    });

    it('should remove an item from the cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/${productId}`)
        .set('Authorization', 'bearer valid-token-user');

      expect(res.statusCode).toEqual(200);
      expect(res.body.items.length).toEqual(0);
    });

    it('should return 404 if the item is not in the cart', async () => {
      const nonExistentProductId = '60d21b4667d0d8992e610c87';
      const res = await request(app)
        .delete(`/api/cart/items/${nonExistentProductId}`)
        .set('Authorization', 'bearer valid-token-user');

      expect(res.statusCode).toEqual(404);
    });

    it('should return a validation error for invalid productId in URL', async () => {
      const res = await request(app)
        .delete('/api/cart/items/invalid-id')
        .set('Authorization', 'bearer valid-token-user');

      expect(res.statusCode).toEqual(400);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).delete(`/api/cart/items/${productId}`);
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if role is not allowed', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/${productId}`)
        .set('Authorization', 'bearer valid-token-admin');

      expect(res.statusCode).toEqual(403);
    });
  });

  // Test for GET /api/cart
  describe('GET /api/cart', () => {
    it('should fetch the current user\'s cart', async () => {
      // Add an item to the cart first
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'bearer valid-token-user')
        .send({ productId, qty });

      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', 'bearer valid-token-user');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('cart');
      expect(res.body.cart.items.length).toEqual(1);
      expect(res.body.cart.items[0].productId).toEqual(productId);
      expect(res.body).toHaveProperty('totals');
      expect(res.body.totals.itemCount).toEqual(1);
      expect(res.body.totals.totalQuantity).toEqual(qty);
    });

    it('should return an empty cart if the user does not have one', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', 'bearer valid-token-user');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('cart');
      expect(res.body.cart.items.length).toEqual(0);
      expect(res.body).toHaveProperty('totals');
      expect(res.body.totals.itemCount).toEqual(0);
      expect(res.body.totals.totalQuantity).toEqual(0);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if role is not allowed', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', 'bearer valid-token-admin');

      expect(res.statusCode).toEqual(403);
    });
  });
});