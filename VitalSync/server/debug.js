require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: No API Key found in .env file");
    process.exit(1);
}

// Print the first few characters to check it loaded (don't show the whole thing)
console.log("🔑 Checking Key starting with:", apiKey.substring(0, 5) + "...");

async function checkModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("\n❌ GOOGLE API ERROR:");
            console.error(JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log("\n✅ SUCCESS! Your Key works. Here are your available models:");
            data.models.forEach(m => {
                // Filter to show only the ones we care about
                if (m.name.includes("gemini")) {
                    console.log(`   - ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("\n⚠️ Weird response:", data);
        }
    } catch (error) {
        console.error("\n❌ NETWORK ERROR:", error.message);
    }
}

checkModels();