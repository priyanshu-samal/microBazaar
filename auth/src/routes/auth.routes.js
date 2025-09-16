const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validator = require('../middleware/validator.middleware');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', validator.registerUserValidator, authController.registerUser);
router.post('/login', validator.loginUserValidator, authController.loginUser);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/logout',authController.logoutUser );

module.exports = router;
