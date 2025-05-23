import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function recreateEmbeddingsTable() {
  try {
    console.log("🚀 Starting to recreate embeddings table...");
    
    // Drop the existing table if it exists
    console.log("🗑️  Dropping existing embeddings table...");
    await db.execute(sql`DROP TABLE IF EXISTS embeddings CASCADE;`);
    
    // Recreate the table with the correct dimensions
    console.log("🔄 Creating new embeddings table with 768 dimensions...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS embeddings (
        id VARCHAR(191) PRIMARY KEY,
        resource_id VARCHAR(191) REFERENCES resources(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding VECTOR(768) NOT NULL
      );
    `);
    
    // Recreate the index
    console.log("🔨 Creating index...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS embedding_idx ON embeddings 
      USING hnsw (embedding vector_cosine_ops);
    `);
    
    console.log("\n🎉 Successfully recreated embeddings table with 768 dimensions!");
    
  } catch (error) {
    console.error("❌ Recreation failed:", error instanceof Error ? error.message : 'Unknown error');
  } finally {
    process.exit(0);
  }
}

// Run the recreation
recreateEmbeddingsTable();
