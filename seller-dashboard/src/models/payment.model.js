const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, required: true },
    paymentId: { type: String },
    razorpayOrderId: { type: String, required: true },
    signature: { type: String },
    status: { type: String, enum: [ 'PENDING', 'COMPLETED', 'FAILED' ], default: 'PENDING' },
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    price: {
        amount: { type: Number, required: true },
        currency: { type: String, required: true, default: 'INR', enum: [ 'INR', "USD" ] }
    }
}, { timestamps: true });



const paymentModel = mongoose.model('payment', paymentSchema);


module.exports = paymentModel;