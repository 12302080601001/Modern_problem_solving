const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'doctor' }, // 'doctor', 'admin', 'receptionist'
  
  // ✅ NEW: Assign Doctor to a Department (e.g., 'Cardiology', 'General', 'Pediatrics')
  department: { type: String, default: 'General' }, 
  
  isAvailable: { type: Boolean, default: true } // Can toggle if doctor is on break
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);