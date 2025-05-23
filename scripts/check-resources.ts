import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkResources() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    
    // Get column names for the resources table
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'resources'
      ORDER BY ordinal_position;
    `);
    
    console.log("\nColumns in resources table:");
    console.log("==========================");
    columns.rows.forEach(col => {
      console.log(`• ${col.column_name} (${col.data_type})`);
    });
    
    // Get sample content
    console.log("\nSample data from resources table:");
    console.log("================================");
    
    // Get a few sample records
    const sampleData = await client.query(`
      SELECT * 
      FROM resources 
      LIMIT 3;
    `);
    
    console.log("\nSample Records:");
    console.log("--------------");
    sampleData.rows.forEach((row, index) => {
      console.log(`\nRecord #${index + 1}:`);
      console.log("-".repeat(60));
      
      // Display each column value
      for (const [key, value] of Object.entries(row)) {
        // Truncate long values for better readability
        let displayValue = value;
        if (typeof value === 'string' && value.length > 100) {
          displayValue = value.substring(0, 100) + '...';
        }
        console.log(`${key}: ${displayValue}`);
      }
    });
    
    // Check if there's any content that looks like lawyer information
    console.log("\nSearching for lawyer information...");
    console.log("================================");
    
    const searchTerms = ['lawyer', 'attorney', 'legal', 'practice', 'law firm'];
    
    for (const term of searchTerms) {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM resources WHERE content ILIKE $1`,
        [`%${term}%`]
      );
      console.log(`Found ${result.rows[0].count} records containing '${term}'`);
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error checking resources:", errorMessage);
  } finally {
    await client.end();
  }
}

console.log("Checking resources table...");
checkResources().catch(console.error);
