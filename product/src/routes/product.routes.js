const express = require('express');
const multer = require('multer');
const productController = require('../controllers/product.controller');
const createAuthMiddleware = require('../middleware/auth.middleware');
const { validateProduct, handleValidationErrors } = require('../middleware/product.validator');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post(
    "/",
    createAuthMiddleware(["admin", "seller"]),
    upload.array("images", 5),
    validateProduct,
    handleValidationErrors,
    productController.createProduct
);


router.get('/',productController.getProducts);

router.patch('/:id',createAuthMiddleware([ "seller"]),productController.updateProduct);

router.delete('/:id',createAuthMiddleware([ "seller"]),productController.deleteProduct);

router.get('/seller',createAuthMiddleware([ "seller"]),productController.getProductsBySeller);

router.get('/:id',productController.getProductById);

module.exports = router;