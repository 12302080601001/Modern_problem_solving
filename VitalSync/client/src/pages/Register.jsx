import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Activity } from "lucide-react";
import { API_URL } from "../config";

function Register() {
  // ✅ States match the backend's expected req.body keys
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Correct endpoint based on our index.js update
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);
      
      if (res.data.success) {
        alert("Registration Successful! You can now login.");
        navigate("/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="bg-emerald-500/20 p-3 rounded-xl">
                <Activity className="text-emerald-400" size={32} />
             </div>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Doctor Sign Up</h2>
          <p className="text-slate-400 mt-2">Join the VitalSync Medical Network</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              required
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              required
              type="password" 
              placeholder="Create Password" 
              className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            {loading ? "Creating Account..." : (
                <>Register Account <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6">
          Already registered?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;