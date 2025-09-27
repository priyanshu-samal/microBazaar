const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    paymentId: {
        type: String,
    },
    razorpayOrderId: {
        type: String,
        required: true,
    },
    signature: {
        type: String,
    },
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED"],
        default: "PENDING",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    price:{
        amount:{
            type:Number,
            required:true,
        },
        currency:{
            type:String,
            required:true,
            default:"INR",
            enum:["INR","USD"]
        }

    }
}, { timestamps: true });

const PaymentModel = mongoose.model('Payment', paymentSchema);

module.exports = PaymentModel;
