require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; // Validates key
    console.log("Fetching available models...");
    
    // There isn't a direct "listModels" function in the simple client, 
    // but we can try the most common ones one by one to see which works.
    
    const candidates = [
      "gemini-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro"
    ];

    console.log("\nTesting which models work for you:");
    
    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Test");
        console.log(`✅ ${modelName} is WORKING!`);
      } catch (error) {
        if (error.message.includes("404")) {
            console.log(`❌ ${modelName} NOT FOUND (404)`);
        } else if (error.message.includes("429")) {
            console.log(`⚠️ ${modelName} EXISTS but is LIMIT REACHED (429)`);
        } else {
            console.log(`❌ ${modelName} Failed: ${error.message.split('[')[0]}`);
        }
      }
    }

  } catch (error) {
    console.error("Error connecting:", error.message);
  }
}

listModels();