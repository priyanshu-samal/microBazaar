const mongoose=require('mongoose');




const adressSchema=new mongoose.Schema({
    street:{type:String},
            city:{type:String},
            state:{type:String},
            country:{type:String},
            zip:{type:String}
})


const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        select:false,
        
    },
    fullName:{
        firstName:{type:String,required:true},
        lastName:{type:String,required:true}
    },
    role:{
        type:String,
        enum:['user','seller'],
        default:'user'
    },
    adress:[
        adressSchema
    ]


});

const UserModel=mongoose.model('User',userSchema);

module.exports=UserModel;
