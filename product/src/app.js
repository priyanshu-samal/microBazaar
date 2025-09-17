const express = require('express');
const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/product.routes');



const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/products', productRoutes);




module.exports = app;