const mongoose=require('mongoose');

const addressSchema=new mongoose.Schema({
    street:{type:String},
            city:{type:String},
            state:{type:String},
            country:{type:String},
            zip:{type:String}
})

const orderSchema=new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  }  ,
  items:[
    {
        product:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
        },
        quantity:{
            type:Number,
            min:1,
            default:1
        },
        price:{
            amount:{
                type:Number,
                required:true,
            },
            currency:{
                type:String,
                required:true,
                enum:["USD","INR"]
            }
        
        }
    
    }
  ],
  status:{
    type:String,
    enum:["PENDING","CONFIRMED","CANCELLED","SHIPPED","DELIVERED"],
    default:"PENDING"
  },
  totalPrice:{
    amount:{
        type:Number,
        required:true,  
    },
    currency:{
        type:String,
        required:true,
        enum:["USD","INR"]
    }
},
shippingAddress:{
    type:addressSchema,
    required:true
},


},{timestamps:true})


const orderModel=mongoose.model('Order',orderSchema);

module.exports=orderModel;