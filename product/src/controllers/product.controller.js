const { uploadImage } = require("../services/imagekit.service");
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const { title, description, priceAmount, priceCurrency } = req.body;
    

    
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

    const product = new Product({
      title,
      description,
      price,
      images: images,
      seller,
    });

    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProduct };
