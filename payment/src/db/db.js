const mongoose = require('mongoose');

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('connected to payment database');
    }catch(err){
        console.log('error connecting to payment database',err);
    }
}

module.exports = connectDB;