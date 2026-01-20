# 🏥 VitalSync: Intelligent Patient Flow & Triage System

> **Revolutionizing the clinical experience with  AI and Real-Time Orchestration.**

**VitalSync** isn't just a queue manager—it is an **AI-powered clinical assistant** that streamlines the entire patient journey. From smart triage that detects emergencies in milliseconds to automated prescription generation, VitalSync ensures doctors focus on care while the system handles the chaos.

## ✨ Key Capabilities

### 🧠 Gemini AI Core
- **Smart Triage:** Instantly analyzes reported symptoms to detect emergencies (e.g., Cardiac Arrest, Stroke) and auto-prioritizes them to the top of the queue.
- **Diagnostic Assistant:** Generates dynamic, medically relevant follow-up questions for patients based on their specific pain points.
- **Clinical Summaries:** Condenses complex patient history into 3-point executive summaries for rapid doctor review.

### 🗣️ Voice-to-Rx Engine
- **Dictation Mode:** Doctors can speak or type rough notes, and the system formats them into a standardized, professional medical prescription using AI.

### ⚡ Real-Time Orchestration
- **Live Synchronization:** Changes on the doctor’s dashboard reflect instantly on the reception kiosk and waiting room TV (0ms latency via Socket.io).
- **Audio-Visual Alerts:** "Ding" notifications and text-to-speech announcements guide patients without confusion.

### 📄 Digital Care Continuum
- **Instant Rx Delivery:** Generates PDF prescriptions on the fly and emails them directly to patients.
- **Live Status Tracking:** Patients receive a unique link to track their position in line from their phone.

---
### 🛡️ Secure Doctor Dashboard
- **Authentication:** Secure Login/Signup for doctors using JWT (JSON Web Tokens).
- **Patient Management:** Doctors can call next, mark as completed, or put patients on hold.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Cloud) |
| **Real-Time** | Socket.io |
| **AI Engine** | Google Gemini 1.5 Flash API |
| **PDF/Email** | PDFKit, Nodemailer |
| **Deployment** | Render |

---

## ⚙️ Installation & Local Setup

Follow these steps to run the project on your local machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/12302080601001/Modern_problem_solving.git]
cd Modern_problem_solving

### Setup Backend (Server)
Navigate to the server folder and install dependencies:
cd VitalSync/server
npm install

### Configure Environment Variables: Create a .env file inside the VitalSync/server folder and add the following keys:

PORT=3001
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

### Start the Server:
cd VitalSync/client
npm install

### Start the React app:
npm run dev
