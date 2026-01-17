import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if a login token exists in the browser storage
  const token = localStorage.getItem("token");

  // If no token, kick them back to the Login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, let them see the page (Dashboard)
  return children;
};

export default ProtectedRoute;