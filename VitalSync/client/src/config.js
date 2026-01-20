// client/src/config.js

const isLocal = window.location.hostname === "localhost";

export const API_URL = isLocal
  ? "http://localhost:3001"                  // If you are on your laptop
  : "https://vitalsync-syuf.onrender.com/"; // If you are on the internet
export default API_URL;
// ⚠️ IMPORTANT: If you know your actual Render Backend URL, replace the link above!