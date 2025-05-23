import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGemini() {
  try {
    console.log("Testing Gemini API connection...");
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set");
    return false;
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("\nTesting PostgreSQL connection...");
    await client.connect();
    
    // Test basic connection
    const result = await client.query("SELECT 1 as test");
    console.log("✅ PostgreSQL connection is working!");
    
    // Check vector extension
    const vectorExt = await client.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );
    console.log(
      vectorExt.rows.length > 0
        ? "✅ Vector extension is installed"
        : "❌ Vector extension is NOT installed"
    );

    // Check embeddings table
    const tableInfo = await client.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'embeddings'"
    );
    console.log(
      tableInfo.rows[0].count > 0
        ? "✅ Embeddings table exists"
        : "❌ Embeddings table does NOT exist"
    );

    // Count embeddings
    if (tableInfo.rows[0].count > 0) {
      const countResult = await client.query("SELECT COUNT(*) as count FROM embeddings");
      console.log(`Total embeddings in database: ${countResult.rows[0].count}`);
    }

    return true;
  } catch (error) {
    console.error("❌ PostgreSQL test failed:", error);
    return false;
  } finally {
    await client.end();
  }
}

async function checkEnvironmentVariables() {
  console.log("\nChecking environment variables...");
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URL',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'NODE_ENV'
  ];

  let allPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.error(`❌ ${varName} is not set`);
      allPresent = false;
    } else {
      console.log(`✅ ${varName} is set${varName === 'NEXT_PUBLIC_APP_URL' ? ` to ${value}` : ''}`);
    }
  }
  return allPresent;
}

async function runTests() {
  console.log("Starting connection tests...\n");
  
  const envResult = await checkEnvironmentVariables();
  const geminiResult = await testGemini();
  const postgresResult = await testPostgres();
  
  console.log("\nTest Summary:");
  console.log(`Environment Variables: ${envResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Gemini API: ${geminiResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`PostgreSQL: ${postgresResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Exit with appropriate code
  process.exit(envResult && geminiResult && postgresResult ? 0 : 1);
}

runTests().catch(console.error);
