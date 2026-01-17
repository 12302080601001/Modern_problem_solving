import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import TvDisplay from './pages/TvDisplay';

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./Dashboard";
import Hallway from "./Hallway";
import PatientTrack from "./pages/PatientTrack";
import Register from "./pages/Register";// ✅ CORRECT // ✅ Import the new file

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Register />} />
          {/* ✅ The Tracking Route for Patients */}
          <Route path="/track/:id" element={<PatientTrack />} />

          {/* Protected Routes (Only for Doctors) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/hallway" element={<Hallway />} />
          <Route path="/display" element={<TvDisplay />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;