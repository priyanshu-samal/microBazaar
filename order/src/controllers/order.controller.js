const orderModel = require('../models/order.model');
const axios = require('axios'); 

async function createOrder(req, res) {
 const user=req.user;
 const token=req.cookies?.token || req.headers?.authorization?.split(' ')[1];

 try {

  const cartResponse = await axios.get('http://localhost:3002/api/cart', {
 headers: { Authorization: `Bearer ${token}` }
  });
  const products=await Promise.all(cartResponse.data.cart.items.map(async item=>{
   const productResponse=await axios.get(`http://localhost:3001/api/products/${item.productId}`);
   return {
     productId: item.productId,
     quantity: item.quantity,
     price: productResponse.data.price
     
   };
   console.log('Product Response:', productResponse.data);

  })).data;
  console.log('Products:', products);
  console.log('Cart Response:', cartResponse.data);
        for (const item of cartResponse.data.cart.items) {
            try {
                const productResponse = await axios.get(`http://localhost:3001/api/products/${item.productId}`);
                console.log('Product:', productResponse.data);
            } catch (error) {
                console.error(`Error fetching product ${item.productId}:`, error);
            }
        }

        // You may want to add a response here, e.g.:
        
        res.status(200).json({ message: 'Order created successfully', products });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { createOrder }