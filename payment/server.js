require('dotenv').config();
const app=require('./src/app');
const connectDB=require('./src/db/db');
const { connect } = require('./src/broker/broker');

connectDB();
connect();


app.listen(3004,()=>{
    console.log('payment service listening on port 3004');
});



