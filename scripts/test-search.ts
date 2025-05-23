import { findRelevantContent } from "@/lib/ai/embedding";

async function testSearch() {
  const testQueries = [
    "Find me a lawyer in Delhi",
    "I need a corporate lawyer",
    "Looking for a family lawyer in Mumbai"
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log("-".repeat(80));
    
    try {
      const results = await findRelevantContent(query);
      
      if (results.length === 0) {
        console.log("No results found");
        continue;
      }
      
      console.log(`Found ${results.length} results:\n`);
      
      results.forEach((result, index) => {
        console.log(`${index + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Content: ${result.content.substring(0, 150)}${result.content.length > 150 ? '...' : ''}`);
        if (result.metadata && Object.keys(result.metadata).length > 0) {
          console.log(`   Metadata: ${JSON.stringify(result.metadata, null, 2).replace(/\n/g, '\n   ')}`);
        }
        console.log();
      });
      
    } catch (error) {
      console.error("Error during search:", error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log("-".repeat(80));
  }
}

// Run the test
testSearch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
