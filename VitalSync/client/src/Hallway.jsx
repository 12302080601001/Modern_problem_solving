// client/src/Hallway.jsx
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// ✅ 1. MAKE SURE THIS IP MATCHES YOUR URL BAR
const SERVER_IP = "http://192.168.56.1:3001";
const API_URL = `${SERVER_IP}/api`;

const socket = io(SERVER_IP, {
  transports: ["websocket"], // Forces a faster, stable connection
  reconnection: true,
});

function Hallway() {
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);
  const lastAnnouncedToken = useRef(null);
  const [audioAllowed, setAudioAllowed] = useState(false);

  // --- 2. FETCH DATA ---
  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${API_URL}/queue`);
      const serving = res.data.find(p => p.status === 'SERVING');
      const waiting = res.data.filter(p => p.status !== 'SERVING' && p.status !== 'COMPLETED');
      
      setCurrent(serving);
      setQueue(waiting.slice(0, 4));
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // --- 3. AUDIO LOGIC (Only speaks ONCE per patient) ---
  useEffect(() => {
    if (current && audioAllowed) {
      if (lastAnnouncedToken.current !== current.tokenNumber) {
        // Stop any current speech to avoid overlap
        window.speechSynthesis.cancel();

        const text = `Now serving token number ${current.tokenNumber}, ${current.patientName}. Room 1.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);

        lastAnnouncedToken.current = current.tokenNumber;
      }
    }
  }, [current, audioAllowed]);

  // --- 4. REAL-TIME LISTENER ---
  useEffect(() => {
    fetchQueue();
    socket.on("queue_update", fetchQueue);

    // Keep connection alive
    const interval = setInterval(fetchQueue, 5000); 

    return () => {
      socket.off("queue_update");
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      onClick={() => setAudioAllowed(true)} // Click anywhere once to enable sound
      className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden p-8 cursor-pointer"
    >
      {/* HEADER */}
      {!audioAllowed && (
        <div className="absolute top-0 left-0 w-full bg-red-500 text-center py-2 z-50 animate-pulse">
          ⚠️ CLICK SCREEN TO ENABLE AUDIO
        </div>
      )}

      <div className="h-full grid grid-cols-12 gap-8">
        
        {/* LEFT: CURRENT PATIENT */}
        <div className="col-span-8 bg-teal-700 rounded-3xl flex flex-col items-center justify-center relative border-4 border-teal-500">
          <h2 className="text-teal-200 text-4xl font-bold uppercase tracking-widest mb-8">Now Serving</h2>
          
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div 
                key={current.tokenNumber}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="text-center"
              >
                <div className="text-[250px] leading-none font-black text-white drop-shadow-2xl">
                  {current.tokenNumber}
                </div>
                <div className="text-6xl font-bold text-teal-100 mt-4">
                  {current.patientName}
                </div>
              </motion.div>
            ) : (
              <div className="text-4xl opacity-50 font-bold">Please Wait...</div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: QUEUE LIST */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-indigo-500 mb-2">
            <h3 className="text-indigo-400 font-bold uppercase tracking-wider">Up Next</h3>
          </div>
          
          {queue.map((p, i) => (
            <div key={p._id} className="bg-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="bg-slate-700 text-white text-2xl font-bold w-14 h-14 rounded-xl flex items-center justify-center">
                  {p.tokenNumber}
                </div>
                <div>
                  <div className="text-xl font-semibold">{p.patientName}</div>
                  <div className="text-slate-400 text-sm">Wait: ~{(i + 1) * 15} min</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Hallway;