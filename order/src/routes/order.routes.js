const express=require('express');
const createAuthMiddleware=require('../middleware/auth.middleware');
const orderController=require('../controllers/order.controller');
const { createOrderValidator, updateOrderAddressValidator }=require('../middleware/validation.middleware');
const router=express.Router();

router.post('/',createAuthMiddleware(["user"]),createOrderValidator,orderController.createOrder);

router.get("/me",createAuthMiddleware(["user"]),orderController.getOrders);

router.post("/:id/cancel",createAuthMiddleware(["user"]),orderController.cancelOrder);

router.patch("/:id/address",createAuthMiddleware(["user"]),updateOrderAddressValidator,orderController.updateOrderAddress);



router.get("/:id",createAuthMiddleware(["user", "admin"]),orderController.getOrderById);




module.exports=router;



