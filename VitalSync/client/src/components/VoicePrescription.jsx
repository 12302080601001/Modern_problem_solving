import { useState, useEffect } from "react";
import { Mic, MicOff, RefreshCw, Send } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config";

const VoicePrescription = ({ patientId, onUpdate }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Setup Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };
  }

  const toggleListen = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
    }
  };

  const handleProcessAI = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    try {
      // Send the messy voice text to our AI endpoint
      const res = await axios.post(`${API_URL}/api/ai/prescribe`, {
        patientId,
        rawText: transcript,
      });
      
      if (res.data.success) {
        alert("Prescription AI-Generated & Saved!");
        onUpdate(); // Refresh the dashboard
        setTranscript("");
      }
    } catch (err) {
      console.error(err);
      alert("AI Processing Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 mt-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Mic size={18} className="text-teal-400" /> AI Voice Prescription
      </h3>
      
      <div className="bg-gray-800 p-3 rounded-lg min-h-[80px] text-gray-300 text-sm mb-4 italic">
        {transcript || "Click the mic and start speaking (e.g., 'Give Paracetamol 500mg twice a day for 3 days')..."}
      </div>

      <div className="flex gap-3">
        <button
          onClick={toggleListen}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
            isListening ? "bg-red-500 animate-pulse text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening ? "Stop Recording" : "Start Speaking"}
        </button>

        <button
          disabled={!transcript || isProcessing}
          onClick={handleProcessAI}
          className="bg-teal-500 hover:bg-teal-400 disabled:bg-gray-700 text-gray-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
          Process with AI
        </button>
      </div>
    </div>
  );
};

export default VoicePrescription;