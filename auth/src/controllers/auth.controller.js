const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const { publishToQueue } = require("../broker/broker")

// -------------------- REGISTER --------------------
async function registerUser(req, res) {
  try {
    const { username, email, password, fullName: { firstName, lastName }, role } = req.body;

    const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(409).json({ message: 'User exists' });

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      role,
      fullName: { firstName, lastName }
    });



    await Promise.all([
            publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
            }),
            publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", user)
        ]);


    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 });

    res.status(201).json({ message: 'User registered', user: { id: user._id, username, email, fullName: user.fullName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// -------------------- LOGIN --------------------
async function loginUser(req, res) {
  try {
    const { username, email, password } = req.body;
    const user = await userModel.findOne({ $or: [{ username }, { email }] }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 });

    res.status(200).json({ message: 'Logged in', user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// -------------------- CURRENT USER --------------------
async function getCurrentUser(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    res.status(200).json({ user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// -------------------- LOGOUT --------------------
async function logoutUser(req, res) {
  try {
    const token = req.cookies.token;
    if (token) await redis.set(`blacklist_${token}`, token, 'EX', 24 * 60 * 60);
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// -------------------- ADDRESSES --------------------
async function getUserAddresses(req, res) {
  try {
    const user = await userModel.findById(req.user._id).select('addresses');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function addAddress(req, res) {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.push(req.body); // add new address
    await user.save();

    res.status(200).json({ addresses: user.addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteAddress(req, res) {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure the address exists
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // Use pull instead of remove
    user.addresses.pull({ _id: req.params.addressId });
    await user.save();

    res.status(200).json({ addresses: user.addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getUserAddresses,
  addAddress,
  deleteAddress
};
