const express = require('express');
const cookieParser = require('cookie-parser');
const sellerRoutes = require('./routes/seller.routes');

const app = express();


app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
  res.send('Seller Dashboard Service is running');
});



app.use("/api/seller/dashboard", sellerRoutes);


module.exports = app;