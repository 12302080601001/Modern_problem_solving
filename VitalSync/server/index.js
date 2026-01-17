require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require('pdfkit'); 

const Queue = require('./models/Queue');
const User = require('./models/User'); 
const { sendTicket, sendPrescriptionEmail } = require('./emailService'); 

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// --- 2. SETUP GEMINI AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// --- 4. HELPER FUNCTION: AI TRIAGE (URGENCY CHECK) ---
async function checkUrgency(symptoms) {
  if (!symptoms) return false;
  try {
    const prompt = `Analyze symptoms: "${symptoms}". Respond ONLY "YES" if emergency, else "NO".`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().toUpperCase().includes("YES");
  } catch (error) {
    console.error("AI Error:", error);
    return false;
  }
}

// --- 5. AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already in use" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newDoctor = new User({ name, email, password: hashedPassword });
    await newDoctor.save();
    res.json({ success: true, message: "Doctor registered successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Doctor not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "YOUR_SECRET_KEY", { expiresIn: '1d' });
    res.json({ success: true, token, name: user.name });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// --- 6. AI ROUTES ---

// A. AI Prescription from Voice
app.post('/api/ai/prescribe', async (req, res) => {
    const { patientId, rawText } = req.body;

    if (!patientId || !rawText) {
        return res.status(400).json({ success: false, message: "Missing Patient ID or Voice Transcript" });
    }

    try {
        const prompt = `
            You are a professional doctor. Convert the following messy voice transcript into a clean, 
            structured medical prescription: "${rawText}".
            Format it like this:
            - Medication Name:
            - Dosage:
            - Frequency:
            - Duration:
            - Additional Notes:
            Return ONLY the structured prescription text.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const structuredPrescription = response.text();

        // Save prescription but DO NOT complete the visit yet
        const updatedPatient = await Queue.findByIdAndUpdate(patientId, { 
            prescription: structuredPrescription
        }, { new: true });

        // Update dashboards so the text box fills automatically
        io.emit('queue_update');

        res.json({ success: true, prescription: structuredPrescription });
    } catch (err) {
        console.error("Prescription AI Error:", err);
        res.status(500).json({ success: false, message: "AI processing failed" });
    }
});

// B. AI Patient History Summary
app.get('/api/history', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    try {
        const history = await Queue.find({ email, status: 'COMPLETED' })
                                   .sort({ createdAt: -1 })
                                   .limit(5);

        if (history.length === 0) {
            return res.json({ success: true, summary: "No previous medical history found." });
        }

        const historyText = history.map(h => 
            `Date: ${h.createdAt ? new Date(h.createdAt).toDateString() : 'N/A'}, Symptoms: ${h.symptoms}, Rx: ${h.prescription}`
        ).join("\n---\n");

        const prompt = `
            Here is a patient's recent medical history:
            ${historyText}
            Summarize this into 2-3 concise bullet points for a doctor to review.
            Focus on recurring symptoms or major treatments.
        `;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        res.json({ success: true, summary });

    } catch (err) {
        console.error("History AI Error:", err);
        res.json({ success: false, summary: "Could not fetch history summary." });
    }
});

// ✅ C. NEW: Generate Triage Questions based on symptoms
app.post('/api/ai/triage-questions', async (req, res) => {
  const { symptoms } = req.body;
  try {
    const prompt = `
      The patient has these symptoms: "${symptoms}".
      Generate exactly 3 short, simple "Yes/No" or "Short Answer" diagnostic questions 
      that a doctor would ask to clarify the condition.
      Return ONLY the questions separated by a pipe character (|).
      Example: Do you have a fever?|How long have you had pain?|Is the pain sharp or dull?
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/\n/g, '').trim();
    
    // Split string into array
    const questions = text.split('|').filter(q => q.length > 5);
    res.json({ success: true, questions });

  } catch (err) {
    console.error("Triage AI Error:", err);
    res.status(500).json({ success: false, message: "AI failed" });
  }
});

// ✅ D. NEW: Save Patient Answers
app.post('/api/save-triage', async (req, res) => {
  const { token, answers } = req.body; // answers = [{ question, answer }]
  try {
    await Queue.findOneAndUpdate({ tokenNumber: token }, { triageAnswers: answers });
    io.emit('queue_update'); // Tell doctor screen to update
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// E. Generate PDF and Email it
app.post('/api/email-prescription', async (req, res) => {
  const { name, email, prescription, symptoms } = req.body;

  if (!email || !prescription) {
    return res.status(400).json({ success: false, message: "Missing email or prescription" });
  }

  try {
    // 1. Create a PDF in memory
    const doc = new PDFDocument();
    let buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      // 2. Send Email with PDF
      await sendPrescriptionEmail(email, name, pdfData);
      res.json({ success: true, message: "Prescription sent successfully!" });
    });

    // --- PDF DESIGN ---
    doc.fontSize(20).text('Smart Clinic Prescription', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toDateString()}`, { align: 'right' });
    doc.text(`Patient Name: ${name}`);
    doc.text(`Symptoms: ${symptoms}`);
    doc.moveDown();
    
    doc.moveTo(50, 160).lineTo(550, 160).stroke();
    doc.moveDown();

    doc.fontSize(16).font('Helvetica-Bold').text('Rx (Prescription):', 50, 180);
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(prescription, {
      width: 500,
      align: 'left',
      lineGap: 5
    });

    doc.moveDown(4);
    doc.fontSize(10).text('Digitally generated by AI Doctor Assistant.', { align: 'center', color: 'grey' });
    
    doc.end();

  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// --- 7. SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- 🏥 QUEUE API ROUTES ---
app.get('/api/queue', async (req, res) => {
  try {
    const { department } = req.query;
    let query = { status: { $in: ['PENDING', 'WAITING', 'SERVING'] } };
    if (department) query.department = department;

    const queue = await Queue.find(query).sort({ priority: -1, tokenNumber: 1 });
    res.json(queue);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/book', async (req, res) => {
  try {
    const { name, email, department, isEmergency, symptoms } = req.body;
    const selectedDept = department || 'General';

    let aiDetectedEmergency = symptoms ? await checkUrgency(symptoms) : false;
    const finalPriority = (isEmergency || aiDetectedEmergency) ? 1 : 0;
    const finalStatus = (isEmergency || aiDetectedEmergency) ? 'WAITING' : 'PENDING';

    const lastToken = await Queue.findOne({ department: selectedDept }).sort({ tokenNumber: -1 });
    const nextTokenNum = lastToken ? lastToken.tokenNumber + 1 : 1;

    const newTicket = new Queue({
      tokenNumber: nextTokenNum,
      name, email, department: selectedDept,
      symptoms, isEmergency: aiDetectedEmergency,
      priority: finalPriority, status: finalStatus
    });

    await newTicket.save();

    if (email) {
      const trackLink = `http://${req.get('host').replace('3001', '5173')}/track/${newTicket.tokenNumber}`;
      sendTicket(email, name, newTicket.tokenNumber, trackLink);
    }

    io.emit('queue_update');
    res.json({ success: true, token: nextTokenNum, aiFlag: aiDetectedEmergency });
  } catch (err) {
    res.status(500).json({ success: false, message: "Booking failed" });
  }
});

// CHECK-IN ROUTE
app.post('/api/checkin', async (req, res) => {
    try {
        const { token } = req.body;
        
        const patient = await Queue.findOneAndUpdate(
            { tokenNumber: token, status: 'PENDING' }, 
            { status: 'WAITING' },
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ success: false, message: "Token not found or already checked in" });
        }

        io.emit('queue_update');
        res.json({ success: true, message: "Checked in successfully" });
    } catch (err) {
        console.error("Check-in Error:", err);
        res.status(500).json({ success: false, message: "Server error during check-in" });
    }
});

// --- 8. QUEUE MANAGEMENT ---
app.post('/api/next', async (req, res) => {
    try {
        const { department } = req.body;
        
        // Mark current patient as COMPLETED
        await Queue.findOneAndUpdate(
            { status: 'SERVING', department: department || 'General' },
            { status: 'COMPLETED' }
        );

        // Call next patient
        const nextPatient = await Queue.findOneAndUpdate(
            { status: 'WAITING', department: department || 'General' },
            { status: 'SERVING' },
            { sort: { priority: -1, tokenNumber: 1 }, new: true }
        );

        if (nextPatient) {
            io.emit('queue_update');
            io.emit('call_patient', { token: nextPatient.tokenNumber, name: nextPatient.name });
            return res.json({ success: true, patient: nextPatient });
        } else {
            return res.json({ success: false, message: "No patients waiting" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error calling next patient" });
    }
});

app.put('/api/token/:id', async (req, res) => {
    try {
        await Queue.findByIdAndUpdate(req.params.id, req.body);
        io.emit('queue_update');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete('/api/token/:id', async (req, res) => {
    try {
        await Queue.findByIdAndDelete(req.params.id);
        io.emit('queue_update');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on Port ${PORT}`);
});