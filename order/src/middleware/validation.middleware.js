const {body,validationResult}=require("express-validator")


const responseWithValidationErrors=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({errors:errors.array()})
    }
    next();
}



const createOrderValidator=[
 body('shippingAddress').exists().withMessage('shippingAddress is required').isObject().withMessage('shippingAddress must be an object'),
 body('shippingAddress.street').exists().withMessage('street is required').isString().withMessage('street must be a string'),
 body('shippingAddress.city').optional().isString().withMessage('city must be a string'),
 body('shippingAddress.state').optional().isString().withMessage('state must be a string'),
 body('shippingAddress.country').optional().isString().withMessage('country must be a string'),
 body('shippingAddress.zip').optional().isString().withMessage('zip must be a string'),
 responseWithValidationErrors,
]

const updateOrderAddressValidator=[
  body('shippingAddress').exists().withMessage('shippingAddress is required').isObject().withMessage('shippingAddress must be an object'),
  body('shippingAddress.street').exists().withMessage('street is required').isString().withMessage('street must be a string'),
  body('shippingAddress.city').optional().isString().withMessage('city must be a string'),
  body('shippingAddress.state').optional().isString().withMessage('state must be a string'),
  body('shippingAddress.country').optional().isString().withMessage('country must be a string'),
  body('shippingAddress.zip').optional().isString().withMessage('zip must be a string'),
  responseWithValidationErrors,
]

module.exports={createOrderValidator, updateOrderAddressValidator   };