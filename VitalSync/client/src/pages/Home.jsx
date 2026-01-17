import { API_URL } from "../config";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Activity } from "lucide-react"; // ✅ Added Activity here
import axios from "axios";

const Home = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // ✅ NEW: State for Department & Emergency & Symptoms
  const [department, setDepartment] = useState("General");
  const [isEmergency, setIsEmergency] = useState(false);
  const [symptoms, setSymptoms] = useState(""); 
  
  const navigate = useNavigate();

  const handleBook = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert("Please fill in all fields");

    try {
      // ✅ SEND NEW DATA TO SERVER
      const res = await axios.post(`${API_URL}/api/book`, { 
  name, email, department, isEmergency, symptoms 
});
      
      if (res.data.success) {
        navigate(`/track/${res.data.token}`);
      }
    } catch (err) {
      console.error(err);
      alert("Booking Failed. Ensure Server is running.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-teal-500 selection:text-white">
      
      {/* --- ✅ NEW HERO HEADER --- */}
      <header className="pt-20 pb-10 flex flex-col items-center justify-center text-center px-4">
        
        {/* Animated Logo Container */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in-down">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-500 p-4 rounded-2xl shadow-lg shadow-teal-500/20 ring-1 ring-white/10">
            <Activity size={48} className="text-white" />
          </div>
          <span className="text-5xl font-black text-white tracking-tight drop-shadow-sm">
            VitalSync
          </span>
        </div>

        {/* Main Slogan with Gradient */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-blue-200 mb-6 tracking-tight">
          Wait Less. Care More.
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-light leading-relaxed mb-8">
          The smart queue management system that respects your time. 
          <br className="hidden md:block" />
          Doctors manage flow efficiently, and patients wait comfortably from anywhere.
        </p>

        {/* Doctor Portal Button */}
        <div>
          <Link 
            to="/login" 
            className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-gray-900 rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Doctor Portal →
          </Link>
        </div>

      </header>

      {/* --- ✅ BOOKING SECTION --- */}
      <section className="py-10 pb-20">
        <div className="container mx-auto px-6 max-w-md">
          <div className={`bg-gray-800 p-8 rounded-3xl border ${isEmergency ? 'border-red-500 shadow-red-500/20 shadow-xl' : 'border-gray-700 shadow-2xl'}`}>
            
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              {isEmergency ? <span className="text-red-500 flex items-center gap-2"><AlertCircle/> EMERGENCY CHECK-IN</span> : "Patient Check-In"}
            </h2>

            <form onSubmit={handleBook} className="space-y-4">
              
              {/* Name & Email */}
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <input type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 focus:border-teal-500 focus:outline-none transition-colors"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <input type="email" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 focus:border-teal-500 focus:outline-none transition-colors"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {/* Department Selector */}
              <div>
                <label className="text-sm text-gray-400">Select Department</label>
                <select 
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white focus:border-teal-500 focus:outline-none transition-colors"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="General">General Medicine</option>
                  <option value="Cardiology">Cardiology (Heart)</option>
                  <option value="Pediatrics">Pediatrics (Children)</option>
                  <option value="Orthopedics">Orthopedics (Bones)</option>
                </select>
              </div>

              {/* ✅ NEW SYMPTOMS FIELD */}
              <div>
                <label className="text-sm text-gray-400">Main Symptoms</label>
                <textarea 
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 h-20 text-white focus:border-teal-500 focus:outline-none transition-colors"
                  placeholder="E.g., High fever, stomach ache, dizzy..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                ></textarea>
              </div>

              {/* Emergency Toggle */}
              <div className="flex items-center gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/30 cursor-pointer hover:bg-red-500/20 transition-colors"
                   onClick={() => setIsEmergency(!isEmergency)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isEmergency ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                  {isEmergency && <CheckCircle size={14} className="text-white"/>}
                </div>
                <span className={isEmergency ? "text-red-400 font-bold" : "text-gray-400"}>
                  This is an Emergency (Priority High)
                </span>
              </div>

              <button type="submit" className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95 ${isEmergency ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-teal-500 hover:bg-teal-400 text-gray-900'}`}>
                {isEmergency ? "Get Emergency Token" : "Get My Token"}
              </button>
            </form>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;