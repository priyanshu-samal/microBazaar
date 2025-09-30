const { uploadImage } = require("../services/imagekit.service");
const productModel = require("../models/product.model");
const mongoose = require('mongoose');
const { publishToQueue } = require("../broker/broker")

const createProduct = async (req, res) => {
  try {
    const { title, description, priceAmount, priceCurrency, stock } = req.body;
    

    
    const seller = req.user.id;
    const  price = {
      amount:Number(priceAmount),
      currency:priceCurrency
    };


    const images = [];
  const uploadedImages=await Promise.all((req.files||[]).map(file => uploadImage({
    buffer:file.buffer,
    filename: file.originalname,
  })))
  images.push(...uploadedImages);

    const product = new productModel({
      title,
      description,
      price,
      images: images,
      seller,
      stock,
    });

    await publishToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED", product);
        await publishToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", {
            email: req.user.email,
            productId: product._id,
            sellerId: seller
        });

    

    return res.status(201).json({
            message: 'Product created',
            data: product,
        });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


async function getProducts(req, res) {
 const { q ,minprice,maxprice,skip=0,limit=20} = req.query;
 const filter = {};

 if (q) {
  filter.$text = { $search: q };
 }

 if (minprice || maxprice) {
  filter['price.amount'] = {};
  if (minprice) {
    filter['price.amount'].$gte = Number(minprice);
  }
  if (maxprice) {
    filter['price.amount'].$lte = Number(maxprice);
  }
 }
 const products=await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit),20));
    return res.status(200).json(products);

}

async function getProductById(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  try {
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params; 
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  try {
    const product=await productModel.findOne({
      _id:id,
      seller:req.user.id
    });
    if(!product){
      return res.status(404).json({ message: 'Product not found or you are not authorized to update this product' }); 
    }
    const allowedUpdates=['title','description','price','stock'];
    for (const key of Object.keys(req.body)){
      if(allowedUpdates.includes(key)){
        if(key==='price' && typeof req.body[key] === 'object'){
          if(req.body.price.amount!==undefined){
            product.price.amount=req.body.price.amount;
          }
          if(req.body.price.currency!==undefined){
            product.price.currency=req.body.price.currency;
          }
        }else{
          product[key]=req.body[key];
        }
      }
    }
    await product.save();
    return res.status(200).json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params; 
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  try {
    const product = await productModel.findOneAndDelete({
      _id: id,
      seller: req.user.id,
    });
    if (!product) {
      return res.status(404).json({
        message: 'Product not found or you are not authorized to delete this product',
      });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getProductsBySeller(req, res) {
 const seller=req.user;
 const {skip=0,limit=20}=req.query;

  const products=await productModel.find({seller:seller.id}).skip(Number(skip)).limit(Math.min(Number(limit),20));
  return res.status(200).json(products);
}

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getProductsBySeller };