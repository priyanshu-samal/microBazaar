const express = require('express');
const cookieParser = require('cookie-parser');
const paymentRoutes = require('../src/routes/payment.routes');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send('Payment Service is running');
});


app.use('/api/payments', paymentRoutes);


module.exports = app;