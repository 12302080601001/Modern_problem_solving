import { API_URL } from "./config"; 
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { 
  LogOut, Activity, Stethoscope, Users, Trash2, CheckCircle, 
  Mic, MicOff, RefreshCw, History, Mail, ClipboardList, AlertCircle 
} from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";

// ✅ Connect Socket to the Central IP
const socket = io.connect(API_URL); 

// ==========================================
// 🧩 COMPONENT 1: AI VOICE ASSISTANT
// ==========================================
const VoicePrescription = ({ patientId, onUpdate }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(text);
    };
  }

  const toggleListen = () => {
    if (!recognition) return alert("Browser not supported");
    if (isListening) { recognition.stop(); setIsListening(false); }
    else { setTranscript(""); recognition.start(); setIsListening(true); }
  };

  const handleProcessAI = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API_URL}/api/ai/prescribe`, { patientId, rawText: transcript });
      if (res.data.success) {
        onUpdate(res.data.prescription);
        setTranscript("");
      }
    } catch (err) { alert("AI Processing Failed"); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-teal-400 uppercase flex items-center gap-1">
          <Mic size={14} /> AI Voice Assistant
        </span>
        {isListening && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>}
      </div>
      <p className="text-sm text-slate-400 italic mb-4 min-h-[40px] border-l-2 border-slate-700 pl-3">
        {transcript || "Click record and dictate the diagnosis/medicine..."}
      </p>
      <div className="flex gap-2">
        <button onClick={toggleListen} className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${isListening ? "bg-red-500 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
          {isListening ? <MicOff size={14} /> : <Mic size={14} />} {isListening ? "Stop" : "Record"}
        </button>
        <button disabled={!transcript || isProcessing} onClick={handleProcessAI} className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-900 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
          {isProcessing ? <RefreshCw className="animate-spin" size={14} /> : "Process AI"}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 🧩 COMPONENT 2: PATIENT HISTORY
// ==========================================
const PatientHistory = ({ patient }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/history?email=${patient.email}`);
      setHistory(res.data.summary || "No significant history found.");
    } catch (err) {
      setHistory("Could not fetch patient history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <History size={16} className="text-indigo-500"/> Medical History
        </h4>
        <button onClick={fetchHistory} disabled={loading} className="text-xs text-indigo-600 font-bold hover:underline">
          {loading ? "Analyzing..." : "Refresh History"}
        </button>
      </div>
      {history && (
        <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-900 italic border border-indigo-100 transition-all">
          {history}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🚀 MAIN DASHBOARD COMPONENT
// ==========================================
function Dashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [queue, setQueue] = useState([]);
  const [currentServing, setCurrentServing] = useState(null);
  
  // ✅ Clinical State
  const [diagnosis, setDiagnosis] = useState("");
  const [medication, setMedication] = useState("");
  
  const navigate = useNavigate();

  // --- 1. FETCH QUEUE ---
  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/queue`);
      
      const serving = res.data.find(p => p.status === 'SERVING');
      
      // 🛑 BUG FIX HERE: 
      // We filter so the list ONLY shows "General" patients (or those with no dept set).
      // This matches what the "Call Next" button looks for.
      const waiting = res.data.filter(p => 
        p.status !== 'SERVING' && 
        p.status !== 'COMPLETED' && 
        (!p.department || p.department === "General")
      );
      
      setCurrentServing(serving);
      setQueue(waiting);
    } catch (err) {
      console.error("Error fetching queue:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    socket.on("queue_update", fetchQueue);
    return () => {
      socket.off("queue_update");
    };
  }, []);

  // ✅ CALLBACK: Handle AI Voice Result
  const handleAIUpdate = (aiPrescription) => {
    setMedication(prev => prev ? prev + "\n" + aiPrescription : aiPrescription);
  };

  // --- 2. GENERATE PDF PRESCRIPTION ---
  const generatePrescription = () => {
    if (!currentServing) return;
    
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text("VitalSync Hospital", 20, 20);
    doc.setFontSize(12); doc.text("Excellence in Care", 20, 28);
    doc.line(20, 32, 190, 32); 

    doc.setFontSize(14);
    doc.text(`Patient: ${currentServing.name}`, 20, 45);
    doc.text(`Token: #${currentServing.tokenNumber}`, 150, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 55);
    
    doc.setFontSize(12);
    doc.text("Symptoms Reported:", 20, 65);
    doc.setFont("helvetica", "italic");
    doc.text(currentServing.symptoms || "None", 25, 72);
    
    doc.setFont("helvetica", "normal");
    doc.text("Diagnosis:", 20, 85);
    doc.setFont("helvetica", "bold");
    doc.text(diagnosis, 25, 92);
    
    doc.setFontSize(16);
    doc.text("Rx (Prescription):", 20, 110);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    const splitText = doc.splitTextToSize(medication, 170);
    doc.text(splitText, 25, 120);

    doc.line(20, 250, 190, 250);
    doc.text("Dr. Smith (General Physician)", 20, 260);
    doc.text("Signature: ________________", 130, 260);

    doc.save(`${currentServing.name}_Prescription.pdf`);
  };

  // --- 3. 📧 SEND EMAIL PRESCRIPTION ---
  const sendEmail = async () => {
    if (!currentServing) return;
    const confirmSend = window.confirm(`Send prescription email to ${currentServing.email}?`);
    if (!confirmSend) return;

    try {
      const res = await fetch(`${API_URL}/api/email-prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentServing.name,
          email: currentServing.email,
          symptoms: currentServing.symptoms,
          prescription: medication
        })
      });
      
      const data = await res.json();
      if (data.success) alert("✅ Email Sent!");
      else alert("❌ Failed: " + data.message);

    } catch (err) {
      console.error(err);
      alert("❌ Error sending email");
    }
  };

  // --- 4. BOOK TOKEN ---
  const bookToken = async () => {
    if (!name) return alert("Please enter a name");
    try {
      // We ensure the department is "General" when booking
      await axios.post(`${API_URL}/api/book`, { name, email, department: "General" });
      setName(""); setEmail(""); fetchQueue();
    } catch (err) { alert("Error booking token"); }
  };

  // --- 5. CALL NEXT PATIENT ---
  const callNext = async () => {
    try {
      // This specifically asks for the "General" queue
      const res = await axios.post(`${API_URL}/api/next`, { department: "General" });
      
      if (res.data.success) {
        setCurrentServing(res.data.patient);
        setDiagnosis("");
        setMedication("");
        const audio = new Audio("/ding.mp3");
        audio.play().catch(e => console.log("Audio play failed"));
      } else {
        fetchQueue(); // Refresh to make sure list is accurate
        alert(res.data.message || "Queue is empty!");
      }
    } catch (err) {
      console.error("Error calling next:", err);
      alert("System Error calling next patient.");
    }
  };

  // --- 6. MANUAL CHECK-IN ---
  const handleCheckIn = async (id) => {
    try {
      await axios.put(`${API_URL}/api/token/${id}`, { status: "WAITING" });
      fetchQueue(); 
    } catch (err) { console.error(err); alert("Could not check in patient."); }
  };

  // --- 7. DELETE TOKEN ---
  const deleteToken = async (id) => {
    if(!window.confirm("Remove this patient?")) return;
    try {
      await axios.delete(`${API_URL}/api/token/${id}`);
      fetchQueue();
    } catch (err) { alert("Error removing patient"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- TOP NAVIGATION --- */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600">
              VitalSync
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-medium text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* --- LEFT COLUMN (Controls) --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. CURRENT PATIENT DISPLAY */}
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-teal-100 font-semibold uppercase tracking-wider text-sm mb-1">Current Patient</h2>
              {currentServing ? (
                <div>
                  <div className="text-6xl font-black tracking-tight flex items-baseline gap-2">
                    <span className="text-teal-200 text-3xl">#</span>
                    {currentServing.tokenNumber}
                  </div>
                  <div className="text-2xl font-medium mt-2">{currentServing.name}</div>
                  <div className="text-sm font-medium mt-1 opacity-80">{currentServing.department}</div>
                </div>
              ) : (
                <div className="text-4xl font-bold text-teal-100/50 py-4">Waiting for Doctor...</div>
              )}
            </div>
          </div>

          {/* 2. REGISTRATION FORM */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Users size={20} className="text-teal-500"/> New Patient Registration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Patient Full Name" 
                className="border border-slate-200 bg-slate-50 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
              />
              <input 
                placeholder="Email (Optional)" 
                className="border border-slate-200 bg-slate-50 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
              />
            </div>
            <button 
              onClick={bookToken} 
              className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-teal-200 transition-all active:scale-95"
            >
              Generate Token
            </button>
          </div>

          {/* 3. ADVANCED DOCTOR CONSOLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Stethoscope className="text-blue-500" size={20} /> Clinical Console
            </h3>

            {currentServing ? (
              <div className="space-y-4">
                
                {/* Show Patient Symptoms */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1">
                     <AlertCircle size={12}/> Reported Symptoms
                  </span>
                  <p className="text-slate-700 mt-1 italic">"{currentServing.symptoms || "No symptoms reported"}"</p>
                </div>

                {/* AI PRE-CHECK / TRIAGE ANSWERS */}
                {currentServing.triageAnswers && currentServing.triageAnswers.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h4 className="text-xs font-bold text-purple-700 uppercase mb-3 flex items-center gap-2">
                      <ClipboardList size={14}/> Patient Pre-Check (AI)
                    </h4>
                    <div className="space-y-3">
                      {currentServing.triageAnswers.map((item, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-purple-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-500 block mb-1">Q: {item.question}</span>
                          <span className="text-sm font-medium text-slate-800">A: {item.answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INTEGRATED: PATIENT HISTORY */}
                <PatientHistory patient={currentServing} />

                {/* Doctor Notes Input */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Diagnosis</label>
                  <input 
                    className="w-full border border-slate-200 rounded p-2 text-sm mt-1"
                    placeholder="E.g. Viral Fever"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Prescription (Rx)</label>
                  <textarea 
                    className="w-full border border-slate-200 rounded p-2 text-sm mt-1 h-20"
                    placeholder="E.g. Paracetamol 500mg - 2x daily"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                  />
                </div>

                {/* INTEGRATED: VOICE ASSISTANT */}
                <VoicePrescription patientId={currentServing._id} onUpdate={handleAIUpdate} />

                {/* BUTTONS ROW */}
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={generatePrescription}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    🖨️ Print Rx
                  </button>
                  
                  {/* EMAIL BUTTON */}
                  <button 
                    onClick={sendEmail}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={16} /> Email PDF
                  </button>

                  <button 
                    onClick={() => { callNext(); }}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-bold text-sm transition-all"
                  >
                    Finish & Call Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-4">No patient currently active.</p>
                <button 
                  onClick={callNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Start Seeing Patients
                </button>
              </div>
            )}
          </div>

        </div>

        {/* --- RIGHT COLUMN (Queue List) --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full max-h-[600px] flex flex-col">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users className="text-indigo-500" size={20} /> Upcoming Queue
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {queue.map((p, index) => (
                  <motion.div 
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`border p-4 rounded-xl shadow-sm flex justify-between items-center group transition-colors
                        ${p.priority === 1 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-indigo-100'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-slate-600 font-bold w-12 h-12 rounded-xl flex items-center justify-center text-xl
                          ${p.priority === 1 ? 'bg-red-200 text-red-800' : 'bg-slate-100'}
                      `}>
                        {p.tokenNumber}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-xs font-medium mt-1 flex gap-2">
                           <span className={`px-2 py-0.5 rounded-full ${p.status === 'WAITING' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                             {p.status}
                           </span>
                           {p.priority === 1 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full">URGENT</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* CHECK-IN BUTTON */}
                      {p.status === 'PENDING' && (
                        <button 
                          onClick={() => handleCheckIn(p._id)}
                          className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}

                      <button 
                        onClick={() => deleteToken(p._id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {queue.length === 0 && (
                  <div className="text-center text-slate-400 py-10">No patients in queue</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;