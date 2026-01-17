const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  // 🆔 Basic Info
  tokenNumber: { type: Number, required: true },
  name: { type: String, required: true }, // Changed from 'patientName' to match index.js
  email: { type: String },
  phone: { type: String }, // ✅ Added for History feature
  
  // 🏥 Smart Features
  department: { 
    type: String, 
    required: true, 
    enum: ['General', 'Cardiology', 'Pediatrics', 'Orthopedics'], 
    default: 'General' 
  }, 
  
  // 🚨 Priority & AI
  symptoms: { type: String, default: "" },        // 🤖 AI Reads this
  isEmergency: { type: Boolean, default: false }, // 🤖 AI sets this
  priority: { type: Number, default: 0 },         // 1 = High, 0 = Normal
  
  // 🚦 Status Tracking
  status: { 
    type: String, 
    enum: ['PENDING', 'WAITING', 'SERVING', 'COMPLETED', 'MISSED', 'SKIPPED'],
    default: 'PENDING' 
  },

  // 🩺 Doctor's Notes (For Phase 3)
  diagnosis: { type: String, default: "" }, 
  prescription: { type: String, default: "" },

  // 📍 Location & Time
  gpsVerified: { type: Boolean, default: false }, // Kept your old useful field
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', TokenSchema);