const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String }, 
  
  // 🏥 Multi-Department Support
  department: { 
    type: String, 
    required: true, 
    enum: ['General', 'Cardiology', 'Pediatrics', 'Orthopedics'], 
    default: 'General' 
  }, 
  
  // 🚨 Emergency Level
  priority: { type: Number, default: 0 },       // 0 = Normal, 1 = Urgent
  isEmergency: { type: Boolean, default: false }, 

  status: { 
    type: String, 
    enum: ['PENDING', 'WAITING', 'SERVING', 'COMPLETED', 'MISSED'], 
    default: 'PENDING' 
  },
  
  // ✅ CLINICAL DATA (For the Doctor Console)
  symptoms: { type: String, default: "" },      
  diagnosis: { type: String, default: "" },     
  prescription: { type: String, default: "" },   

  // ✅ NEW: AI Triage Answers (REQUIRED for the 3 Questions feature)
  triageAnswers: [
    {
      question: String,
      answer: String
    }
  ],

  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Queue', QueueSchema);