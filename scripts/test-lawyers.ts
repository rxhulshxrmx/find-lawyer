import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testLawyers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    
    // Test 1: Check if lawyers table exists and has data
    console.log("\nChecking lawyers table...");
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lawyers'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error("❌ Error: 'lawyers' table does not exist");
      return false;
    }
    
    console.log("✅ 'lawyers' table exists");
    
    // Test 2: Count number of lawyers
    const countResult = await client.query("SELECT COUNT(*) as count FROM lawyers");
    const lawyerCount = parseInt(countResult.rows[0].count);
    console.log(`\nFound ${lawyerCount} lawyers in the database`);
    
    if (lawyerCount === 0) {
      console.error("❌ No lawyers found in the database");
      return false;
    }
    
    // Test 3: Get sample lawyer data
    console.log("\nFetching sample lawyer data...");
    const sampleLawyers = await client.query(`
      SELECT id, name, specialization, experience_years, rating, location 
      FROM lawyers 
      LIMIT 3;
    `);
    
    console.log("\nSample Lawyers:");
    console.log("===============");
    sampleLawyers.rows.forEach((lawyer, index) => {
      console.log(`\nLawyer #${index + 1}:`);
      console.log(`Name: ${lawyer.name}`);
      console.log(`Specialization: ${lawyer.specialization}`);
      console.log(`Experience: ${lawyer.experience_years} years`);
      console.log(`Rating: ${lawyer.rating}/5`);
      console.log(`Location: ${lawyer.location}`);
    });
    
    return true;
    
  } catch (error) {
    console.error("❌ Error testing lawyers data:", error);
    return false;
  } finally {
    await client.end();
  }
}

async function runTest() {
  console.log("Starting lawyers data test...");
  const success = await testLawyers();
  
  console.log("\nTest Summary:");
  console.log(`Lawyers data test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  
  process.exit(success ? 0 : 1);
}

runTest().catch(console.error);
