import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function updateEmbeddingDimensions() {
  try {
    console.log("🚀 Starting to update embedding dimensions...");
    
    // 1. Create a new temporary column with the correct dimensions
    console.log("🔧 Adding temporary column with new dimensions...");
    await db.execute(sql`
      ALTER TABLE embeddings 
      ADD COLUMN IF NOT EXISTS new_embedding vector(768);
    `);

    // 2. Copy data from old column to new column (this will fail if dimensions don't match)
    console.log("📝 Copying data to temporary column...");
    try {
      await db.execute(sql`
        UPDATE embeddings 
        SET new_embedding = embedding::text::vector(768);
      `);
      console.log("✅ Successfully converted embeddings to 768 dimensions");
    } catch (error) {
      console.error("❌ Error converting embeddings:", error instanceof Error ? error.message : 'Unknown error');
      console.log("\n⚠️  Could not automatically convert embeddings. You may need to regenerate them.");
      console.log("   Dropping the temporary column...");
      await db.execute(sql`ALTER TABLE embeddings DROP COLUMN IF EXISTS new_embedding;`);
      process.exit(1);
    }

    // 3. Drop the old column
    console.log("🗑️  Dropping old column...");
    await db.execute(sql`ALTER TABLE embeddings DROP COLUMN embedding;`);

    // 4. Rename new column to original name
    console.log("🔄 Renaming columns...");
    await db.execute(sql`ALTER TABLE embeddings RENAME COLUMN new_embedding TO embedding;`);

    // 5. Recreate the index
    console.log("🔨 Recreating index...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS embedding_idx ON embeddings 
      USING hnsw (embedding vector_cosine_ops);
    `);

    console.log("\n🎉 Successfully updated embedding dimensions to 768");
    console.log("✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateEmbeddingDimensions();
