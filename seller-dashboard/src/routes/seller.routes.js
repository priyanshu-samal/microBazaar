const express = require('express');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const controller = require("../controllers/seller.controller")

const router = express.Router();



router.get("/metrics", createAuthMiddleware([ "seller" ], controller.getMetrics))

router.get("/orders", createAuthMiddleware([ "seller" ], controller.getOrders))

router.get("/products", createAuthMiddleware([ "seller" ], controller.getProducts))


module.exports = router;