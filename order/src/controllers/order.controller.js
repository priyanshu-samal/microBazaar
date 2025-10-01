const orderModel = require('../models/order.model');
const axios = require('axios'); 
const { publishToQueue } = require("../broker/broker")

// -------------------- CREATE ORDER --------------------



async function createOrder(req, res) {
 const user=req.user;
 const token=req.cookies?.token || req.headers?.authorization?.split(' ')[1];

 try {

  const requestItems = Array.isArray(req.body?.items) ? req.body.items : null;
  let sourceItems;

  if (requestItems) {
    sourceItems = requestItems;
  } else {
    const cartResponse = await axios.get('http://microbazzar-alb-1038075917.ap-south-1.elb.amazonaws.com/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    sourceItems = cartResponse.data.cart.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
  }

  if (!sourceItems || sourceItems.length === 0) {
    return res.status(400).json({ message: 'No items to order' });
  }

  const products = await Promise.all(
    sourceItems.map(async (item) => {
      if (item.price !== undefined && item.price !== null) {
        const priceAmount = typeof item.price === 'number' ? Number(item.price) : Number(item.price.amount);
        const currency = typeof item.price === 'object' && item.price.currency ? item.price.currency : 'INR';
        return {
          product: item.productId,
          quantity: Number(item.quantity),
          stock: Number.MAX_SAFE_INTEGER,
          price: { amount: priceAmount, currency },
        };
      }

      const productResponse = await axios.get(`http://microbazzar-alb-1038075917.ap-south-1.elb.amazonaws.com/api/products/${item.productId}`);
      const product = productResponse.data;
      return {
        product: product._id,
        quantity: Number(item.quantity),
        stock: Number(product.stock) || 0,
        price: {
          amount: Number(product.price.amount),
          currency: product.price.currency,
        },
      };
    })
  );

  const outOfStockItems = products
    .filter(p => Number(p.quantity) > Number(p.stock))
    .map(p => ({ product: p.product, requested: p.quantity, available: p.stock }));

  if (outOfStockItems.length > 0) {
    return res.status(400).json({
      message: 'One or more items exceed available stock',
      items: outOfStockItems,
    });
  }

  const subtotal = products.reduce((sum, p) => sum + (Number(p.price.amount) * Number(p.quantity)), 0);
  const taxPrice = Math.round(subtotal * 0.1 * 100) / 100;
  const shippingPrice = subtotal > 0 ? 50 : 0;
  const totalAmount = subtotal + taxPrice + shippingPrice;
  const currency = products[0]?.price?.currency || 'INR';

  // Attempt to reserve inventory before creating the order
  try {
    await axios.post(
      'http://microbazzar-alb-1038075917.ap-south-1.elb.amazonaws.com/api/inventory/reserve',
      {
        items: products.map(p => ({ productId: p.product, quantity: p.quantity })),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      }
    );
  } catch (reservationError) {
    return res.status(408).json({ message: 'Inventory reservation failed' });
  }

  const order = await orderModel.create({
    user: user.id,
    items: products.map(({ stock, ...rest }) => rest),
    status: 'PENDING',
    totalPrice: {
      amount: totalAmount,
      currency,
    },
    shippingAddress: typeof req.body?.shippingAddress === 'string'
      ? { street: req.body.shippingAddress, city: '', state: '', country: '', zip: '' }
      : (req.body?.shippingAddress || { street: '', city: '', state: '', country: '', zip: '' }),
  });

  

  res.status(201).json({
    status: 'pending',
    userId: user.id,
    taxPrice,
    shippingPrice,
    total: totalAmount,
    currency,
    orderId: order._id,
  });

      await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED", order)  



    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getOrders(req, res) {
  const user = req.user;
  
  const page=parseInt(req.query.page) || 1;
  const limit=parseInt(req.query.limit) || 10;
  const skip=(page-1)*limit;

  try{
    const orders=await orderModel.find({ user: user.id });
    const totalorder=await orderModel.countDocuments({ user: user.id });
    const totalPages=Math.ceil(totalorder/limit);
    
    res.status(200).json({
      orders,
      pagination:{
        page,
        limit,
        totalPages,
      }
    })
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getOrderById(req, res) {
 const user = req.user;
 const orderId=req.params.id;

 try{
  const order=await orderModel.findById(orderId);
  if(!order){
    return res.status(404).json({ message: 'Order not found' });
  }
  res.status(200).json(order);
 } catch (error) {
  console.error('Error getting order by id:', error);
  res.status(500).json({ error: 'Internal server error' });
 }
}

async function cancelOrder(req, res) {
  const user = req.user;
  const orderId = req.params.id;
  try{
    const order=await orderModel.findById(orderId);
    if(!order){
      return res.status(404).json({ message: 'Order not found' });
    }
    if(order.user.toString() !== user.id){
      return res.status(403).json({ message: 'You are not authorized to cancel this order' });
    }
    if(order.status !== 'PENDING'){
      return res.status(400).json({ message: 'Order is not pending' });
    }
    order.status = 'CANCELLED';
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateOrderAddress(req, res) {
  const user = req.user;
  const orderId = req.params.id;
  const { shippingAddress } = req.body;
  try{
    const order=await orderModel.findById(orderId);
    if(!order){
      return res.status(404).json({ message: 'Order not found' });
    }
    if(order.user.toString() !== user.id){
      return res.status(403).json({ message: 'You are not authorized to update this order' });
    }
    if(order.status !== 'PENDING'){
      return res.status(400).json({ message: 'Order is not pending' });
    }
        } catch (error) {
    console.error('Error updating order address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  
  order.shippingAddress = shippingAddress;
  await order.save();
  res.status(200).json(order);
}




module.exports = { createOrder ,getOrders,getOrderById,cancelOrder,updateOrderAddress}