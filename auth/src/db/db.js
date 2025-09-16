const mongoose=require('mongoose');



async function connectDB(){
    try{
        if (process.env.NODE_ENV === 'test') {
            // In-memory database is handled by jest.setup.js
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB connected');
    }catch(error){
        console.log(error);
    }
}

module.exports=connectDB;