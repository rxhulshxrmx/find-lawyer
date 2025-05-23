import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGemini() {
  try {
    console.log("Testing Gemini API connection...");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Hello, can you tell me a short joke?";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini API is working!");
    console.log("Response:", text);
    return true;
  } catch (error) {
    console.error("❌ Gemini API test failed:", error);
    return false;
  }
}

async function testPostgres() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("\nTesting PostgreSQL connection...");
    await client.connect();
    const result = await client.query("SELECT 1 as test");
    console.log("✅ PostgreSQL connection is working!");
    console.log("Test query result:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ PostgreSQL test failed:", error);
    return false;
  } finally {
    await client.end();
  }
}

async function runTests() {
  console.log("Starting connection tests...\n");
  
  const geminiResult = await testGemini();
  const postgresResult = await testPostgres();
  
  console.log("\nTest Summary:");
  console.log(`Gemini API: ${geminiResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`PostgreSQL: ${postgresResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Exit with appropriate code
  process.exit(geminiResult && postgresResult ? 0 : 1);
}

runTests().catch(console.error);
