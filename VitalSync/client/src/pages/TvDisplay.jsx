import { API_URL } from "../config"; // ✅ Use your centralized config
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";

// ✅ Connect using the centralized URL
const socket = io.connect(API_URL); 

const TvDisplay = () => {
  const [queue, setQueue] = useState([]);
  const [serving, setServing] = useState(null);
  const [recentCall, setRecentCall] = useState(null);
  const [time, setTime] = useState(new Date());
  
  // ✅ New State: Browsers block audio until user clicks. We track this.
  const [audioEnabled, setAudioEnabled] = useState(false);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/queue`);
      
      // Get the person currently being served
      const current = res.data.find(p => p.status === 'SERVING');
      
      // Get the next 5 people waiting (Any department)
      // 🔥 ADDED SORTING: Put Emergency (Priority 1) at the top, then sort by Token Number
      const waiting = res.data
        .filter(p => p.status === 'WAITING')
        .sort((a, b) => {
           // Sort by Priority (High to Low), then Token (Low to High)
           if (b.priority !== a.priority) return b.priority - a.priority;
           return a.tokenNumber - b.tokenNumber;
        })
        .slice(0, 5); 
      
      setServing(current);
      setQueue(waiting);
    } catch (err) {
      console.error("Error fetching TV data:", err);
    }
  };

  // --- 2. TEXT TO SPEECH ---
  const announce = (text) => {
    if (!audioEnabled) return; // Don't try if user hasn't clicked yet

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slightly slower is better for hospitals
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    fetchData();

    // ✅ Live Clock Timer
    const timer = setInterval(() => setTime(new Date()), 1000);

    socket.on("queue_update", fetchData);

    // --- 3. LISTEN FOR CALLS (VOICE) ---
    socket.on("call_patient", (data) => {
      setRecentCall(data);
      
      // Only play sound if user has enabled audio
      if (audioEnabled) {
        // Ensure you have a 'ding.mp3' in your public folder!
        const audio = new Audio("/ding.mp3");
        audio.play().catch(e => console.log("Audio blocked:", e));

        // Speak after chime (1.5s delay)
        setTimeout(() => {
          const text = `Attention please. Token number ${data.tokenNumber}. ${data.name}. Please proceed to Doctor.`;
          announce(text);
        }, 1500);
      }

      // Clear "Flash" animation after 8 seconds
      setTimeout(() => setRecentCall(null), 8000);
    });

    return () => {
      socket.off("queue_update");
      socket.off("call_patient");
      clearInterval(timer);
    };
  }, [audioEnabled]); // Re-run listener logic if audio status changes

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden flex relative">
      
      {/* --- AUDIO ENABLE OVERLAY --- */}
      {!audioEnabled && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <button 
            onClick={() => setAudioEnabled(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-2xl flex items-center gap-4 shadow-2xl animate-bounce"
          >
            <Volume2 size={32} /> Click to Start TV Display
          </button>
        </div>
      )}

      {/* --- LEFT SIDE: NOW SERVING (BIG) --- */}
      <div className="w-2/3 flex flex-col items-center justify-center border-r border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 relative">
        
        {/* Flashing Animation when called */}
        {recentCall && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-teal-500/20 z-0 animate-pulse"
          />
        )}

        <div className="z-10 text-center space-y-8">
          <h2 className="text-4xl text-slate-400 uppercase tracking-[0.2em] font-light">Now Serving</h2>
          
          <AnimatePresence mode="wait">
            {serving ? (
              <motion.div 
                key={serving.tokenNumber}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-teal-600 rounded-[3rem] p-16 shadow-[0_0_100px_rgba(20,184,166,0.4)] border-8 border-teal-400/50"
              >
                <div className="text-[14rem] font-black leading-none tracking-tighter text-white drop-shadow-lg">
                  {serving.tokenNumber}
                </div>
                <div className="text-5xl font-bold mt-6 text-teal-100">{serving.name}</div>
                <div className="mt-8 inline-block bg-white/20 px-8 py-3 rounded-full text-2xl font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                  {serving.department || "General"}
                </div>
              </motion.div>
            ) : (
              <div className="text-6xl font-bold text-slate-700 py-20">Please Wait...</div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- RIGHT SIDE: UP NEXT LIST --- */}
      <div className="w-1/3 bg-slate-800 p-8 flex flex-col border-l border-slate-700">
        <h3 className="text-3xl font-bold text-slate-400 mb-8 border-b border-slate-600 pb-4 flex justify-between items-end">
          <span>Up Next</span>
          <span className="text-sm font-normal text-slate-500">Queue List</span>
        </h3>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          <AnimatePresence>
            {queue.map((p, i) => (
              <motion.div 
                key={p._id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl flex justify-between items-center shadow-lg border-l-8 
                  ${p.priority === 1 ? 'bg-slate-700 border-red-500' : 'bg-slate-700 border-amber-400'}
                `}
              >
                <div className="flex items-center gap-5">
                  <div className={`text-4xl font-bold ${p.priority === 1 ? 'text-red-400' : 'text-amber-400'}`}>
                    #{p.tokenNumber}
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-slate-100">{p.name}</div>
                    <div className="text-sm text-slate-400 uppercase tracking-wide">{p.department || "General"}</div>
                  </div>
                </div>
                {p.priority === 1 && <span className="text-red-400 font-bold animate-pulse text-sm uppercase border border-red-500/50 px-2 py-1 rounded">Urgent</span>}
              </motion.div>
            ))}
            {queue.length === 0 && (
              <div className="text-slate-500 text-2xl text-center mt-20 italic">Queue is currently empty</div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Info with Real Clock */}
        <div className="mt-auto pt-8 border-t border-slate-700">
           <div className="flex justify-between items-center text-slate-400 uppercase tracking-widest">
             <span className="font-bold text-teal-500">VitalSync System</span>
             <span className="text-2xl font-mono text-white">
               {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default TvDisplay;