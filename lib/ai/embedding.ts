import { GoogleGenerativeAI } from "@google/generative-ai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { db } from "../db";
import { env } from "@/lib/env.mjs";

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);

// Initialize the embedding model
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Embedding dimensions - must match the database schema
const EMBEDDING_DIMENSIONS = 768;

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(/[.!?]+/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0 && chunk.length < 1000) // Filter empty and overly long chunks
    .slice(0, 20); // Limit to 20 chunks to avoid overwhelming the system
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  try {
    const chunks = generateChunks(value);
    
    if (chunks.length === 0) {
      throw new Error("No valid chunks generated from input");
    }

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const result = await embeddingModel.embedContent({
          content: {
            role: "user",
            parts: [{ text: chunk }]
          }
        });
        return {
          content: chunk,
          embedding: result.embedding.values
        };
      })
    );
    
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error}`);
  }
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  try {
    const input = value.replaceAll("\n", " ").trim();
    
    if (!input) {
      throw new Error("Empty input provided for embedding");
    }

    const result = await embeddingModel.embedContent({
      content: {
        role: "user",
        parts: [{ text: input }]
      }
    });
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating single embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
};

export interface RelevantContent {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export const findRelevantContent = async (userQuery: string): Promise<RelevantContent[]> => {
  console.log('Starting findRelevantContent with query:', userQuery?.substring(0, 100) || 'undefined');
  
  try {
    if (!userQuery?.trim()) {
      console.warn("Empty query provided to findRelevantContent");
      return [];
    }

    console.log("Generating embedding for query:", userQuery.substring(0, 100) + (userQuery.length > 100 ? '...' : ''));
    
    try {
      const userQueryEmbedded = await generateEmbedding(userQuery);
      
      if (!userQueryEmbedded || userQueryEmbedded.length === 0) {
        console.error("Failed to generate embedding for query - empty embedding returned");
        return [];
      }

      console.log("Successfully generated embedding, length:", userQueryEmbedded.length);

      // Convert the embedding to a PostgreSQL array format
      const embeddingArray = `[${userQueryEmbedded.join(',')}]`;
      
      console.log("Executing vector search query...");
      
      try {
        // Test database connection first
        await db.execute(sql`SELECT 1 as test`);
        console.log("Database connection test successful");
        
        // Get table info for debugging
        const tableInfo = await db.execute(sql`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'embeddings';
        `);
        console.log('Embeddings table exists:', tableInfo);
        
        // Get count of embeddings for debugging
        const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM embeddings;`);
        console.log('Total embeddings in database:', countResult[0]?.count || 0);
        
        // Execute the vector search query
        const queryStart = Date.now();
        const results = await db.execute(sql`
          SELECT 
            id, 
            content,
            1 - (embedding <=> ${embeddingArray}::vector) as similarity
          FROM 
            embeddings
          WHERE 
            1 - (embedding <=> ${embeddingArray}::vector) > 0.25
          ORDER BY 
            similarity DESC
          LIMIT 6;
        `) as Array<{ id: string; content: string; similarity: number }>;
        
        console.log(`Vector search completed in ${Date.now() - queryStart}ms`);
        console.log(`Found ${results.length} raw results`);

        // Parse the content if it's a JSON string
        const parsedResults = results.map(item => {
          try {
            const content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
            const parsedContent = JSON.parse(content);
            return {
              ...item,
              content: typeof parsedContent === 'object' ? 
                (parsedContent.content || parsedContent.name || JSON.stringify(parsedContent)) : 
                content,
              metadata: typeof parsedContent === 'object' ? parsedContent : {}
            };
          } catch (e) {
            console.error("Error parsing content for item:", item.id, e);
            return { 
              ...item, 
              content: typeof item.content === 'string' ? item.content : 'Invalid content',
              metadata: {},
              _parseError: e instanceof Error ? e.message : 'Unknown error'
            };
          }
        });

        console.log(`Successfully parsed ${parsedResults.length} results`);
        return parsedResults;
        
      } catch (dbError) {
        console.error("Database error in findRelevantContent:", dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
      }
      
    } catch (embeddingError) {
      console.error("Error generating embedding:", embeddingError);
      throw new Error(`Failed to generate embedding: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in findRelevantContent:", errorMessage);
    console.error("Full error:", error);
    throw error; // Re-throw to be handled by the caller
  }
};