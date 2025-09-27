const {body, param, validationResult} = require('express-validator');

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

const validateAddItemToCart = [
   body('productId')
   .isMongoId()
   .withMessage('Product ID must be a valid Mongo ID'),
   
   body('qty')
   .isInt({ gt: 0 })
   .withMessage('Quantity must be a positive integer'),
   validateRequest,
];

const validateUpdateCartItem = [
    param('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid Mongo ID'),
    body('qty')
    .isInt({ gt: 0 })
    .withMessage('Quantity must be a positive integer'),
    validateRequest,
];

const validateDeleteCartItem = [
    param('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid Mongo ID'),
    validateRequest,
];

module.exports = {
    validateAddItemToCart,
    validateUpdateCartItem,
    validateDeleteCartItem,
};

