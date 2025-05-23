import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add the project root to the module path
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the required modules
const { findRelevantContent } = await import('../../lib/ai/embedding.js');
const { db } = await import('../../lib/db/index.js');

async function testRAG() {
  try {
    console.log("Testing RAG with query: 'divorce lawyer'");
    
    // Test database connection first
    console.log("Testing database connection...");
    try {
      const result = await db.execute('SELECT 1 as test');
      console.log("Database connection successful:", result);
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return;
    }
    
    console.log("Searching for relevant content...");
    const results = await findRelevantContent("divorce lawyer");
    
    console.log("\nSearch Results:");
    console.log("-".repeat(50));
    
    if (!results || results.length === 0) {
      console.log("No results found. The embeddings might not be properly generated or the similarity threshold is too high.");
      return;
    }
    
    results.forEach((result, index) => {
      console.log(`\nResult ${index + 1}:`);
      console.log(`Similarity: ${result.similarity.toFixed(4)}`);
      console.log(`ID: ${result.id}`);
      
      // Safely handle the content which might be an object or string
      let contentStr;
      try {
        contentStr = typeof result.content === 'string' 
          ? result.content 
          : JSON.stringify(result.content, null, 2);
      } catch (e) {
        contentStr = '[Error parsing content]';
      }
      
      console.log(`Content: ${contentStr.substring(0, 200)}${contentStr.length > 200 ? '...' : ''}`);
      
      if (result.metadata) {
        console.log(`Metadata: ${JSON.stringify(result.metadata, null, 2)}`);
      }
      
      console.log("-".repeat(50));
    });
  } catch (error) {
    console.error("Error in testRAG:", error);
  } finally {
    process.exit(0);
  }
}

testRAG();
