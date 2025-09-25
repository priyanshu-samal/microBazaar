const express=require('express');
const cookieParser=require('cookie-parser');
const createAuthMiddleware=require('../middleware/auth.middleware');
const orderController=require('../controllers/order.controller');

const router=express.Router();

router.post('/',createAuthMiddleware(["user"]),orderController.createOrder);






module.exports=router;



