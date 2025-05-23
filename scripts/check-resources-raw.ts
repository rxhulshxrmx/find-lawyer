import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkResourcesRaw() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    
    // Get a sample of the raw content
    console.log("\nFetching sample content from resources table...");
    const result = await client.query(`
      SELECT content 
      FROM resources 
      LIMIT 1;
    `);
    
    if (result.rows.length === 0) {
      console.log("No records found in the resources table.");
      return;
    }
    
    console.log("\nRaw content from first record:");
    console.log("============================");
    console.log(result.rows[0].content);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error checking resources:", errorMessage);
  } finally {
    await client.end();
  }
}

console.log("Checking raw resources content...");
checkResourcesRaw().catch(console.error);
