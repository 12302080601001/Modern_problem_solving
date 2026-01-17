import { API_URL } from "../config";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Lock, Mail, Activity, ArrowRight, UserPlus } from "lucide-react"; // Added UserPlus icon

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/login`, { email, password });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      } else {
        alert("Invalid Credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Login Failed. Please check your email/password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
        <div className="bg-gradient-to-tr from-teal-500 to-emerald-500 p-3 rounded-xl shadow-lg shadow-teal-500/20">
          <Activity size={32} className="text-white" />
        </div>
        <span className="text-3xl font-black text-white tracking-tight">
          VitalSync
        </span>
      </div>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Doctor Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
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
              className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 text-gray-900 font-bold py-3 rounded-lg shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? "Logging in..." : (
              <>
                Access Console <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* 🆕 Registration Link */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 mb-2">New to the platform?</p>
          <Link 
            to="/register" 
            className="flex items-center justify-center gap-2 text-teal-400 hover:text-teal-300 font-semibold transition-colors group"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            Create Doctor Account
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to Patient Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;