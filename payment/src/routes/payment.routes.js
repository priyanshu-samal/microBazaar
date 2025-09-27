const express=require("express");
const createAuthMiddleware=require("../middleware/auth.middleware.js");
const paymentController = require("../controllers/payment.controller");



const router=express.Router();

router.post("/create/:orderId",createAuthMiddleware(["user"]),paymentController.createPayment);

router.post("/verify", createAuthMiddleware(["user"]), paymentController.verifyPayment)



module.exports=router;