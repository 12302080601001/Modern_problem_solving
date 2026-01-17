// client/src/pages/HallwayDisplay.jsx
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Volume2, Activity } from "lucide-react";

// ⚠️ REPLACE WITH YOUR IP ADDRESS (Same as you did for tracking)
const SOCKET_URL = "http://192.168.0.104:3001"; 

const socket = io.connect(SOCKET_URL);
const API_URL = `${SOCKET_URL}/api`;

const HallwayDisplay = () => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [nextPatients, setNextPatients] = useState([]);

  // FETCH DATA
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/queue`);
      
      // 1. Find who is status "SERVING"
      const serving = res.data.find(p => p.status === 'SERVING');
      
      // 2. Find the next 3 people "ACTIVE" or "PENDING"
      const upcoming = res.data
        .filter(p => p.status === 'ACTIVE' || p.status === 'PENDING')
        .slice(0, 3); // Only show top 3

      // 🔊 AUDIO LOGIC: If a NEW patient is being served, speak!
      if (serving && (!currentPatient || currentPatient.tokenNumber !== serving.tokenNumber)) {
        announceToken(serving.tokenNumber);
      }

      setCurrentPatient(serving || null);
      setNextPatients(upcoming);

    } catch (err) {
      console.error("Error updating hallway display");
    }
  };

  // 🗣️ TEXT-TO-SPEECH FUNCTION
  const announceToken = (tokenNum) => {
    // Basic browser speech API
    const msg = new SpeechSynthesisUtterance(`Token Number ${tokenNum}, please proceed to Room 1.`);
    msg.rate = 0.9; // Slightly slower for clarity
    msg.pitch = 1;
    window.speechSynthesis.speak(msg);
  };

  useEffect(() => {
    fetchData();
    socket.on("queue_update", fetchData);
    return () => socket.off("queue_update");
  }, [currentPatient]); // Depend on currentPatient to track changes

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden flex">
      
      {/* --- LEFT SIDE: NOW SERVING (70% width) --- */}
      <div className="w-[70%] flex flex-col items-center justify-center border-r border-slate-700 relative">
        
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-slate-900 pointer-events-none"></div>

        <div className="z-10 text-center space-y-8">
           <h2 className="text-4xl text-green-400 font-bold uppercase tracking-[0.2em] animate-pulse">
             Now Serving
           </h2>

           {currentPatient ? (
             <>
               <div className="text-[14rem] leading-none font-black text-white drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]">
                 #{currentPatient.tokenNumber}
               </div>
               <div className="text-6xl text-slate-300 font-light">
                 {currentPatient.patientName}
               </div>
               
               {/* Sound Icon Animation */}
               <div className="mt-12 flex items-center justify-center gap-3 text-green-400">
                  <Volume2 size={40} className="animate-bounce" />
                  <span className="text-2xl uppercase font-bold tracking-widest">Calling...</span>
               </div>
             </>
           ) : (
             <div className="text-5xl text-slate-600 font-bold">
               PLEASE WAIT...
             </div>
           )}
        </div>
      </div>

      {/* --- RIGHT SIDE: UP NEXT (30% width) --- */}
      <div className="w-[30%] bg-slate-800 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-600 pb-4">
           <Activity className="text-blue-400" />
           <h3 className="text-2xl font-bold text-slate-300 uppercase">Up Next</h3>
        </div>

        <div className="space-y-4">
          {nextPatients.map((p) => (
            <div key={p._id} className="bg-slate-700/50 p-6 rounded-xl border-l-4 border-yellow-500 flex justify-between items-center">
              <div>
                 <div className="text-sm text-slate-400 uppercase font-bold">Token</div>
                 <div className="text-4xl font-bold text-white">#{p.tokenNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-xl text-slate-300 truncate w-32">{p.patientName}</div>
                <div className="text-xs text-yellow-500 font-bold mt-1">{p.status}</div>
              </div>
            </div>
          ))}

          {nextPatients.length === 0 && (
             <div className="text-slate-500 text-center mt-10 italic">
               Queue is empty
             </div>
          )}
        </div>

        <div className="mt-auto pt-8 border-t border-slate-600 text-center">
           <p className="text-slate-500 text-sm">VitalSync Intelligent Queue</p>
        </div>
      </div>

    </div>
  );
};

export default HallwayDisplay;