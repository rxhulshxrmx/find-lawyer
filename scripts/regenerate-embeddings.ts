import { db } from "@/lib/db";
import { embeddings } from "@/lib/db/schema/embeddings";
import { resources } from "@/lib/db/schema/resources";
import { generateEmbedding } from "@/lib/ai/embedding";
import { sql } from "drizzle-orm";

async function regenerateEmbeddings() {
  try {
    console.log("🚀 Starting to regenerate embeddings...");
    
    // 1. Get all resources that need embeddings
    console.log("📋 Fetching resources...");
    const allResources = await db
      .select({
        id: resources.id,
        content: resources.content,
      })
      .from(resources);

    console.log(`Found ${allResources.length} resources to process`);

    // 2. Process each resource in batches
    const BATCH_SIZE = 5;
    let processed = 0;

    for (let i = 0; i < allResources.length; i += BATCH_SIZE) {
      const batch = allResources.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allResources.length / BATCH_SIZE)}`);
      
      // Process each resource in parallel
      await Promise.all(batch.map(async (resource) => {
        try {
          // Generate new embedding
          const embedding = await generateEmbedding(resource.content);
          
          // Delete existing embeddings for this resource
          await db
            .delete(embeddings)
            .where(sql`${embeddings.resourceId} = ${resource.id}`);
          
          // Insert new embedding
          await db.insert(embeddings).values({
            resourceId: resource.id,
            content: resource.content,
            embedding: sql`${JSON.stringify(embedding)}::vector`,
          });
          
          console.log(`✅ Processed resource ${++processed}/${allResources.length}: ${resource.id}`);
        } catch (error) {
          console.error(`❌ Error processing resource ${resource.id}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }));
    }
    
    console.log("\n🎉 Successfully regenerated all embeddings!");
    
  } catch (error) {
    console.error("❌ Regeneration failed:", error instanceof Error ? error.message : 'Unknown error');
  } finally {
    process.exit(0);
  }
}

// Run the regeneration
regenerateEmbeddings();
