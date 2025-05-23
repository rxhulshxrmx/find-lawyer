import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function checkDatabase() {
  try {
    console.log("Checking database connection...");
    
    // Test connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful");
    
    // Check if embeddings table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'embeddings'
      ) as exists;
    `);
    
    console.log("\nEmbeddings table exists:", tableExists[0]?.exists);
    
    if (tableExists[0]?.exists) {
      // Check if embeddings table has data
      const countResult = await db.execute(sql`
        SELECT COUNT(*)::integer as count FROM embeddings;
      `);
      
      const count = Number(countResult[0]?.count) || 0;
      console.log(`\nFound ${count} embeddings in the database`);
      
      if (count > 0) {
        // Get a sample embedding
        const sample = await db.execute(sql`
          SELECT id, content, embedding::text as embedding_sample
          FROM embeddings 
          LIMIT 1;
        `);
        
        if (sample[0]) {
          console.log("\nSample embedding:");
          console.log("ID:", sample[0].id);
          
          const content = String(sample[0].content || '');
          console.log("Content preview:", content.substring(0, Math.min(100, content.length)) + (content.length > 100 ? '...' : ''));
          
          const embeddingStr = String(sample[0].embedding_sample || '')
            .replace(/[{}]/g, '') // Remove curly braces
            .split(',')
            .slice(0, 10)
            .join(', ');
            
          console.log("Embedding vector (first 10 dimensions):", embeddingStr + '...');
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking database:", error instanceof Error ? error.message : String(error));
  } finally {
    process.exit(0);
  }
}

console.log("Starting database check...");
checkDatabase().catch(console.error);
