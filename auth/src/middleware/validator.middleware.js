const { body, validationResult } = require('express-validator');

const responseWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerUserValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .isString().withMessage('Username must be a string'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  body('fullName.firstName')
    .notEmpty().withMessage('First name is required')
    .isString().withMessage('First name must be a string'),

  body('fullName.lastName')
    .notEmpty().withMessage('Last name is required')
    .isString().withMessage('Last name must be a string'),
    body('role')
    .optional()
    .isIn(['user', 'seller']).withMessage('Role must be either user or seller'), 

  responseWithValidationErrors
];

const loginUserValidator = [
  body('password')
    .notEmpty().withMessage('Password is required'),

  // Custom logic: require either email OR username
  body('email')
    .if((value, { req }) => !req.body.username) // only required if username is not provided
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),

  body('username')
    .if((value, { req }) => !req.body.email) // only required if email is not provided
    .notEmpty().withMessage('Username is required'),

  responseWithValidationErrors
];

const addressValidator = [
  body('street').optional().isString().withMessage('Street must be a string'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('country').optional().isString().withMessage('Country must be a string'),
  body('zip').optional().isString().withMessage('Zip must be a string'),
];

module.exports = { registerUserValidator, loginUserValidator, addressValidator };
