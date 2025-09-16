const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validator = require('../middleware/validator.middleware');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', validator.registerUserValidator, authController.registerUser);
router.post('/login', validator.loginUserValidator, authController.loginUser);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/logout',authController.logoutUser );
router.post('/users/me/addresses', authMiddleware, authController.addAddress);
router.get('/users/me/addresses', authMiddleware, authController.getUserAddresses);
router.delete('/users/me/addresses/:addressId', authMiddleware, authController.deleteAddress);


module.exports = router;
