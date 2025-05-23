import postgres from "postgres";
import { env } from "@/lib/env.mjs";

async function setupDatabase() {
  console.log("🔧 Setting up database...");
  
  if (!env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in environment variables");
    process.exit(1);
  }

  const client = postgres(env.DATABASE_URL, { max: 1 });
  
  try {
    // Check if pgvector extension exists
    const extensions = await client`
      SELECT name, installed_version 
      FROM pg_available_extensions 
      WHERE name IN ('vector', 'pg_trgm');
    `;

    console.log("\n📊 Available extensions:");
    console.table(extensions);

    // Enable required extensions
    console.log("\n🔧 Enabling required extensions...");
    await client`CREATE EXTENSION IF NOT EXISTS vector`;
    await client`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    
    console.log("✅ Extensions enabled successfully");
    
    // Verify vector extension is working
    const vectorVersion = await client`SELECT extversion FROM pg_extension WHERE extname = 'vector'`;
    console.log("\n📦 Vector extension version:", vectorVersion[0]?.extversion || "Not found");
    
    // Test vector operations
    try {
      const testVector = await client`SELECT '[1,2,3]'::vector`;
      console.log("✅ Vector operations test successful:", testVector);
    } catch (error) {
      console.error("❌ Vector operations test failed:", error instanceof Error ? error.message : 'Unknown error');
    }
    
  } catch (error) {
    console.error("❌ Database setup failed:", error instanceof Error ? error.message : 'Unknown error');
    console.log("\n🔧 You might need to install the pgvector extension in your PostgreSQL database:");
    console.log("   For Homebrew PostgreSQL: brew install pgvector");
    console.log("   Then in psql: CREATE EXTENSION vector;");
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
