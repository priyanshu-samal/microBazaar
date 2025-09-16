const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis')


async function registerUser(req, res) {
  try {
    const { username, email, password, fullName: { firstName, lastName } } = req.body;

    const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      fullName: { firstName, lastName }
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { username, email, password } = req.body;
    const user = await userModel.findOne({ $or: [{ username }, { email }] }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Logged in successfully',
      user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getCurrentUser(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    res.status(200).json({ user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}



async function logoutUser(req, res) {
  try {
    const token = req.cookies.token; 
    if (token) {
      await redis.set(`blacklist_${token}`, token, 'EX', 24 * 60 * 60); 
    }

    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}




module.exports = { registerUser, loginUser, getCurrentUser, logoutUser };
