import { API_URL } from "../config";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion"; 
import { UserPlus, Lock, Mail, User, Activity } from "lucide-react"; 
import axios from "axios";

// ✅ UPDATED: Your specific IP Address for Mobile + Laptop access
const SERVER_IP = "http://192.168.1.15:3001";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Send Signup Request
      const res = await axios.post(`${SERVER_IP}/api/signup`, { 
        name, 
        email, 
        password,
        role: "doctor" // Defaulting to doctor for this demo
      });
      
      if (res.data.success) {
        // 2. Save Token (Just like in Login.jsx)
        localStorage.setItem("token", res.data.token);
        
        // 3. Redirect to Dashboard
        alert("Account Created! Welcome to VitalSync.");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Signup Failed. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 font-sans">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
        <div className="bg-gradient-to-tr from-teal-500 to-emerald-500 p-3 rounded-xl shadow-lg shadow-teal-500/20">
          <Activity size={32} className="text-white" />
        </div>
        <span className="text-3xl font-black text-white tracking-tight">
          VitalSync
        </span>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Doctor Account</h1>
          <p className="text-gray-400 text-sm">Start managing your patient queue today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Input */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 text-gray-900 font-bold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-teal-500/20"
          >
            {loading ? "Creating Account..." : (
               <> <UserPlus size={20} /> Register Clinic </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-400 font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;