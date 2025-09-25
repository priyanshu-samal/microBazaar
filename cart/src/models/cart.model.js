const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
       }
    ],
},{
        timestamps: true,
    }
); 


const cartModel=mongoose.model('Cart', cartItemSchema);

module.exports = cartModel
