import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function checkEmbeddings() {
  try {
    // Check if vector extension is installed
    console.log("Checking if vector extension is installed...");
    try {
      const extResult = await db.execute(sql`
        SELECT * FROM pg_extension WHERE extname = 'vector';
      `);
      console.log("Vector extension is installed:", extResult.length > 0);
    } catch (e) {
      console.log("Vector extension is NOT installed or not accessible");
      console.log("Error:", e instanceof Error ? e.message : String(e));
    }
    
    // Check if embeddings table exists and has data
    console.log("\nChecking embeddings table...");
    try {
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'embeddings'
        ) as exists;
      `);
      
      console.log("Embeddings table exists:", tableExists[0]?.exists || false);
      
      if (tableExists[0]?.exists) {
        const countResult = await db.execute(sql`
          SELECT COUNT(*)::integer as count FROM embeddings;
        `);
        
        const count = Number(countResult[0]?.count) || 0;
        console.log("Total embeddings in database:", count);
        
        if (count > 0) {
          console.log("\nSample embedding:");
          const sample = await db.execute(sql`
            SELECT id, content, embedding::text as embedding_sample
            FROM embeddings 
            LIMIT 1;
          `);
          
          if (sample[0]) {
            const row = sample[0];
            console.log("ID:", row.id);
            const content = String(row.content || '');
            console.log("Content preview:", content.substring(0, Math.min(100, content.length)) + (content.length > 100 ? '...' : ''));
            
            // Clean up the embedding string and get first 10 dimensions
            const embeddingStr = String(row.embedding_sample || '')
              .replace(/[{}]/g, '') // Remove curly braces
              .split(',')
              .slice(0, 10)
              .join(', ');
              
            console.log("Embedding vector (first 10 dimensions):", embeddingStr + '...');
          }
        }
      }
    } catch (e) {
      console.log("Error checking embeddings table:", e instanceof Error ? e.message : String(e));
    }
    
  } catch (error) {
    console.error("Error checking embeddings:", error);
  } finally {
    process.exit(0);
  }
}

console.log("Starting embeddings check...");
checkEmbeddings().catch(console.error);
