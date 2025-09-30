require('dotenv').config();
const app=require('./src/app');
const connectDB=require('./src/db/db');
const { connect } = require('./src/broker/broker');

connect();

connectDB();

app.listen(3003,()=>{
    console.log("Order server started at port 3003");
});

