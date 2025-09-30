require('dotenv').config();
const app = require('./src/app');

const connectDB = require('./src/db/db');
const listener = require('./src/broker/listener');
const { connect } = require('./src/broker/broker');


connectDB();

connect().then(() => {
    listener();
})





app.listen(3007, () => {
    console.log('Seller server is running on port 3007');
})