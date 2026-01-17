require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash";

async function testRaw() {
  console.log("🔑 Testing Key ending in:", API_KEY ? "..." + API_KEY.slice(-4) : "MISSING");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Are you working?" }] }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS! The API Key works.");
      console.log("🤖 AI Replied:", data.candidates[0].content.parts[0].text);
    } else {
      console.log("❌ FAILED. Google says:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("❌ Network Error:", err.message);
  }
}

testRaw();