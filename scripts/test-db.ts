import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/lib/env.mjs";
import { embeddings } from "@/lib/db/schema/embeddings";
import { sql } from "drizzle-orm";

async function testDatabase() {
  console.log("🔍 Testing database configuration...");
  
  // 1. Check if DATABASE_URL is set
  if (!env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in environment variables");
    console.log("\n🔧 Please add DATABASE_URL to your .env file:");
    console.log("   DATABASE_URL=postgresql://user:password@localhost:5432/your_database");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL is set");
  
  // 2. Test raw connection
  console.log("\n🔌 Testing database connection...");
  let client;
  try {
    client = postgres(env.DATABASE_URL, { max: 1 });
    const result = await client`SELECT 'Database connection successful' as test`;
    console.log(`✅ Connection test: ${result[0].test}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Failed to connect to the database:", errorMessage);
    console.log("\n🔧 Please check:");
    console.log("1. Is PostgreSQL running?");
    console.log("2. Are the credentials in DATABASE_URL correct?");
    console.log("3. Can you connect using psql or another client?");
    process.exit(1);
  }

  // 3. Test Drizzle ORM
  console.log("\n🔍 Testing Drizzle ORM...");
  try {
    const db = drizzle(client);
    
    // Test a simple query
    await db.select({ test: sql<string>`'Drizzle connected'` });
    console.log("✅ Drizzle connection successful");
    
    // Check if embeddings table exists
    try {
      const tableInfo = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(embeddings)
        .limit(1);
      
      console.log("✅ Embeddings table exists");
      console.log(`📊 Total embeddings: ${tableInfo[0]?.count || 0}`);
      
      // Show first few embeddings if they exist
      if (tableInfo[0]?.count > 0) {
        // Get the first embedding to check its properties
        const sample = await db
          .select({
            id: embeddings.id,
            content: sql<string>`substring(${embeddings.content}, 1, 100) || '...'`,
            embeddingType: sql<string>`pg_typeof(${embeddings.embedding})`,
            embeddingDims: sql<number>`array_length(regexp_split_to_array(trim(both '[]' from ${embeddings.embedding}::text), ','), 1)`,
          })
          .from(embeddings)
          .limit(3);
        
        console.log("\nSample embeddings:", JSON.stringify(sample, null, 2));
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("\n❌ Error querying embeddings table:", errorMessage);
      console.log("\n🔧 You may need to run database migrations.");
      console.log("   Try running: pnpm db:push");
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Drizzle connection failed:", errorMessage);
  } finally {
    if (client) {
      await client.end();
    }
    process.exit(0);
  }
}

// Run the test
testDatabase().catch(console.error);
