const { body, validationResult } = require('express-validator');

const validateProduct = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('priceAmount').notEmpty().isNumeric().withMessage('Price amount must be a number'),
    body('priceCurrency').optional().isIn(['USD', 'INR']).withMessage('Invalid currency'),
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { validateProduct, handleValidationErrors };
