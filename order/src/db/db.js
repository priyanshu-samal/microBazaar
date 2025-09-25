const mongoose=require('mongoose');


async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Order DB connected");
    }catch(error){
        console.log(error);
    }
}



module.exports=connectDB;