# 🏥 VitalSync - AI-Powered Smart Hospital Queue Management

**VitalSync** is a modern, intelligent queue management system designed to reduce hospital waiting times and streamline patient flow. By integrating **Google Gemini AI** and **Real-Time WebSockets**, it prioritizes emergency cases automatically, assists doctors with AI prescriptions, and keeps patients informed via live displays.

---

## 🚀 Live Demo
**[Click here to view the Live Application](https://vitalsync-syuf.onrender.com)** *(Replace with your actual Render URL if different)*

---

## ✨ Key Features

### 🧠 AI-Powered Triage & Assistance
- **Emergency Detection:** Analyzes patient symptoms using Gemini AI to automatically flag high-risk cases and move them to the front of the queue.
- **Dynamic Triage Questions:** Generates smart follow-up diagnostic questions for patients based on their reported symptoms.
- **Patient History Summary:** Summarizes previous visits into concise bullet points for the doctor.
- **Voice-to-Prescription:** Doctors can speak or type messy notes, and AI converts them into a structured, professional prescription format.

### ⚡ Real-Time Queue System
- **Live Updates:** Uses `Socket.io` to update the queue instantly on all screens (Doctor, Reception, Hallway, TV) without refreshing.
- **TV & Hallway Displays:** dedicated views for waiting rooms showing current token numbers and serving counters.
- **Voice Announcements:** "Ding" sound and text-to-speech announcement when a new patient is called.

### 📨 Digital Health Records
- **PDF Prescriptions:** Automatically generates a professional PDF prescription.
- **Email Integration:** Sends the digital prescription directly to the patient's email.
- **Patient Tracking:** Patients can track their live status via a personal link.

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
git clone [https://github.com/YOUR_USERNAME/Modern_problem_solving.git](https://github.com/YOUR_USERNAME/Modern_problem_solving.git)
cd Modern_problem_solving
