import { API_URL } from "../config"; 
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; // ✅ Added Socket for live updates
import { MapPin, Navigation, ToggleLeft, ToggleRight, ClipboardList, CheckCircle, Activity } from "lucide-react";

const socket = io.connect(API_URL);

// ⚠️ CHANGE THIS TO YOUR CLINIC'S REAL LOCATION
const CLINIC_LOCATION = {
  lat: 21.1702, 
  lng: 72.8311 
};
const ALLOWED_DISTANCE_KM = 0.5; // Patient must be within 0.5 km

function PatientTrack() {
  const { id } = useParams(); // Token Number
  const [tokenData, setTokenData] = useState(null);
  const [queuePos, setQueuePos] = useState(null);
  
  // --- 📍 GPS STATE ---
  const [realDistance, setRealDistance] = useState(null);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  // --- 🤖 AI TRIAGE STATE ---
  const [showTriage, setShowTriage] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);

  // --- 1. FETCH DATA & SOCKET ---
  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/queue`);
      const myTicket = res.data.find(t => t.tokenNumber === parseInt(id));
      
      if (myTicket) {
        setTokenData(myTicket);
        if (myTicket.triageAnswers && myTicket.triageAnswers.length > 0) {
          setSubmitted(true);
        }

        // Calculate position in line
        const waiting = res.data.filter(t => t.status === 'WAITING' || t.status === 'SERVING');
        const myIndex = waiting.findIndex(t => t.tokenNumber === parseInt(id));
        setQueuePos(myIndex >= 0 ? myIndex : "Wait");
      }
    } catch (err) { console.error("Error fetching token:", err); }
  };

  useEffect(() => {
    fetchStatus();
    socket.on("queue_update", fetchStatus);
    return () => socket.off("queue_update");
  }, [id]);

  // --- 2. GPS LOGIC ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const d = calculateDistance(
            position.coords.latitude, position.coords.longitude,
            CLINIC_LOCATION.lat, CLINIC_LOCATION.lng
          );
          setRealDistance(d.toFixed(2));
        },
        (err) => setError("Please enable GPS to check in."),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else { setError("Geolocation not supported."); }
  }, []);

  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/api/checkin`, { token: parseInt(id) });
      alert("Checked in successfully!");
      fetchStatus();
    } catch (err) { alert("Error checking in."); }
  };

  const finalDistance = demoMode ? "0.00" : realDistance;
  const isWithinRange = finalDistance && parseFloat(finalDistance) <= ALLOWED_DISTANCE_KM;

  // --- 3. AI TRIAGE LOGIC ---
  const startTriage = async () => {
    setLoadingQ(true);
    setShowTriage(true);
    try {
      const res = await axios.post(`${API_URL}/api/ai/triage-questions`, { 
        symptoms: tokenData.symptoms 
      });
      setQuestions(res.data.questions);
    } catch (err) { alert("Could not load AI questions"); }
    finally { setLoadingQ(false); }
  };

  const submitTriage = async () => {
    const formattedAnswers = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || "Not Answered"
    }));

    try {
      await axios.post(`${API_URL}/api/save-triage`, { 
        token: parseInt(id), 
        answers: formattedAnswers 
      });
      setSubmitted(true);
      setShowTriage(false);
    } catch (err) { alert("Error saving answers"); }
  };

  if (!tokenData) return <div className="p-10 text-center text-gray-500">Loading Ticket...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      
      {/* Demo Mode Toggle */}
      <button 
        onClick={() => setDemoMode(!demoMode)}
        className={`fixed bottom-5 right-5 z-50 px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 transition-all 
        ${demoMode ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}
      >
        {demoMode ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
        {demoMode ? "Demo Mode: ON" : "Demo Mode: OFF"}
      </button>

      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden relative">
        
        {/* --- HEADER --- */}
        <div className={`p-8 text-center transition-colors ${tokenData.status === 'SERVING' ? 'bg-green-500' : 'bg-indigo-600'}`}>
          <h2 className="text-white font-bold tracking-widest uppercase opacity-90">Your Token</h2>
          <div className="text-7xl font-black text-white mt-2">#{tokenData.tokenNumber}</div>
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full mt-3 text-sm font-bold border border-white/30">
            {tokenData.status}
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="flex justify-between text-center divide-x divide-gray-100 p-4 border-b">
          <div className="w-1/2">
            <div className="text-slate-400 text-xs font-bold uppercase">Estimated Wait</div>
            <div className="text-xl font-bold text-slate-800">~{queuePos !== "Wait" ? queuePos * 15 : 0} min</div>
          </div>
          <div className="w-1/2">
            <div className="text-slate-400 text-xs font-bold uppercase">Position</div>
            <div className="text-xl font-bold text-slate-800">{queuePos}</div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* --- 📍 GPS CHECK-IN SECTION --- */}
          <div className={`border rounded-xl p-5 text-center transition-all duration-300 ${isWithinRange ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className="font-bold text-slate-700 flex items-center justify-center gap-2">
              <MapPin size={20} className={isWithinRange ? "text-green-600" : "text-blue-500"}/> 
              {isWithinRange ? "You are at the Clinic" : "Location Check"}
            </h3>
            
            <p className="text-sm text-slate-500 mt-2">
              Distance: <strong className="text-slate-900">{finalDistance !== null ? `${finalDistance} km` : "Locating..."}</strong>
            </p>

            {isWithinRange ? (
              <button 
                onClick={handleCheckIn}
                disabled={tokenData.status !== 'PENDING'}
                className={`mt-4 w-full py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2
                  ${tokenData.status === 'PENDING' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-green-100 text-green-700 cursor-default border border-green-200'}`}
              >
                  {tokenData.status === 'PENDING' ? (
                    <> <Navigation className="w-4 h-4"/> Click to Check In </>
                  ) : (
                    <> <CheckCircle className="w-4 h-4"/> Checked In! </>
                  )}
              </button>
            ) : (
              <button disabled className="mt-4 w-full bg-slate-200 text-slate-400 py-3 rounded-xl font-bold cursor-not-allowed">
                Get Closer ({ALLOWED_DISTANCE_KM}km)
              </button>
            )}
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          {/* --- 🤖 AI TRIAGE SECTION (New) --- */}
          {!submitted && tokenData.status !== 'SERVING' && tokenData.status !== 'COMPLETED' && (
            <div className="border-t pt-4">
              {!showTriage ? (
                <button 
                  onClick={startTriage}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Activity size={18} />
                  Speed up check-in (Answer 3 Qs)
                </button>
              ) : (
                <div className="text-left bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <ClipboardList size={16}/> AI Pre-Check
                  </h3>
                  {loadingQ ? (
                    <div className="text-sm text-indigo-500 animate-pulse">AI is generating questions...</div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, i) => (
                        <div key={i}>
                          <label className="text-xs font-bold text-slate-600 block mb-1">{q}</label>
                          <input 
                            className="w-full p-2 rounded border border-indigo-200 text-sm focus:outline-indigo-500"
                            placeholder="Type answer..."
                            onChange={(e) => setAnswers({...answers, [i]: e.target.value})}
                          />
                        </div>
                      ))}
                      <button 
                        onClick={submitTriage}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm mt-2 hover:bg-indigo-700"
                      >
                        Submit Answers
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-green-700 text-sm font-bold justify-center border border-green-200">
              <CheckCircle size={16} /> AI Info sent to doctor!
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default PatientTrack;