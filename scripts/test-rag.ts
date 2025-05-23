import { findRelevantContent } from "@/lib/ai/embedding";

async function testRAG() {
  try {
    console.log("Testing RAG with query: 'divorce lawyer'");
    const results = await findRelevantContent("divorce lawyer");
    
    console.log("\nSearch Results:");
    console.log("-".repeat(50));
    
    results.forEach((result, index) => {
      console.log(`\nResult ${index + 1}:`);
      console.log(`Similarity: ${result.similarity.toFixed(4)}`);
      console.log(`Content: ${result.content.substring(0, 200)}...`);
      console.log("-".repeat(50));
    });
    
    if (results.length === 0) {
      console.log("No results found. The embeddings might not be properly generated or the similarity threshold is too high.");
    }
  } catch (error) {
    console.error("Error testing RAG:", error);
  } finally {
    process.exit(0);
  }
}

testRAG();
