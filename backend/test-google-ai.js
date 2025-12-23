
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GOOGLE_API_KEY;

console.log("Testing Google AI Integration...");
console.log("Model: gemini-2.0-flash");

async function testConnection() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log("🤖 Sending request...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();

        console.log("✅ Success! Response:");
        console.log(text);
    } catch (error) {
        console.error("❌ Error testing Google AI:");
        // Log the full error structure to see details
        console.error(JSON.stringify(error, null, 2));
        console.error(error);
    }
}

testConnection();
