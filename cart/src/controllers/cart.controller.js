const cartmodel=require("../models/cart.model");
const axios = require('axios');

async function addItemToCart(req,res){
    try {
      console.log('Request Body:', req.body);
      const {productId, qty}=req.body;
      const user =req.user

      let cart=await cartmodel.findOne({user:user.id});
      if(!cart){
        cart=new cartmodel({user:user.id, items:[]});
      }
      const productResponse = await axios.get(`http://127.0.0.1:3001/api/products/${productId}`);
      const product = productResponse.data;
      const stockAvailable = Number(product.stock) || 0;

      const existingItemIndex=cart.items.findIndex(item=>item.productId.toString()===productId);
      if(existingItemIndex>=0){
        const proposedQuantity = cart.items[existingItemIndex].quantity + qty;
        cart.items[existingItemIndex].quantity = Math.min(proposedQuantity, stockAvailable);
      }else{
        const quantityToAdd = Math.min(qty, stockAvailable);
        cart.items.push({productId, quantity: quantityToAdd});
      }
      await cart.save();
      res.status(201).json(cart);
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function updateCartItem(req, res) {
    try {
        const { productId } = req.params;
        const { qty } = req.body;
        const user = req.user;

        let cart = await cartmodel.findOne({ user: user.id });

        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in cart" });
        }

        const productResponse = await axios.get(`http://127.0.0.1:3001/api/products/${productId}`);
        const product = productResponse.data;
        const stockAvailable = Number(product.stock) || 0;

        cart.items[itemIndex].quantity = Math.min(qty, stockAvailable);
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error("Error updating item in cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function deleteCartItem(req, res) {
    try {
        const { productId } = req.params;
        const user = req.user;

        let cart = await cartmodel.findOne({ user: user.id });

        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in cart" });
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error("Error deleting item from cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getCart(req, res) {
    try {
        const user = req.user;

        let cart = await cartmodel.findOne({ user: user.id });

        if (!cart) {
            cart = new cartmodel({ user: user.id, items: [] });
            await cart.save();
        }

        res.status(200).json({
            cart,
            totals: {
                itemCount: cart.items.length,
                totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0)
            }
        });
    } catch (error) {
        console.error("Error retrieving cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }   
}

module.exports = {
    addItemToCart,
    updateCartItem,
    deleteCartItem,
    getCart
};
