import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    
    // List all tables in the public schema
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    if (result.rows.length === 0) {
      console.log("No tables found in the public schema");
      return;
    }
    
    console.log("\nAvailable tables in the database:");
    console.log("================================");
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // For each table, show the structure
    console.log("\nTable Structures:");
    console.log("================");
    
    for (const row of result.rows) {
      const tableName = row.table_name;
      console.log(`\nTable: ${tableName}`);
      console.log("-".repeat(60));
      
      try {
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);
        
        if (columns.rows.length === 0) {
          console.log("  No columns found");
          continue;
        }
        
        // Display column information
        console.log("  Columns:");
        columns.rows.forEach(col => {
          console.log(`    • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Show row count
        const count = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`  Rows: ${parseInt(count.rows[0].count).toLocaleString()}`);
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`  Error getting structure for table ${tableName}:`, errorMessage);
      }
    }
    
  } catch (error) {
    console.error("Error listing tables:", error);
  } finally {
    await client.end();
  }
}

console.log("Checking database tables...");
listTables().catch(console.error);
