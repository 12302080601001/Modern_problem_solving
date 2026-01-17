const router = require('express').Router();
const User = require('../models/User'); // Ensure you have this model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. SIGNUP ROUTE (This was likely missing or broken)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'doctor' // Default to doctor if not specified
    });

    const savedUser = await newUser.save();

    // Generate Token immediately so they are logged in
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ 
      token, 
      user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role } 
    });

  } catch (err) {
    console.error("Signup Error:", err); // Logs error to your terminal
    res.status(500).json({ message: err.message });
  }
});

// 2. LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;