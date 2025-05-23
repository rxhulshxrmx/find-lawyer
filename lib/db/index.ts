import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema/embeddings';
import { env } from "@/lib/env.mjs";

// Connection string
const connectionString = env.DATABASE_URL;

// Configure postgres client with retries
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Maximum lifetime of a connection in seconds
  ssl: 'require', // Enable SSL
  prepare: false, // Disable prepared statements for better compatibility
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Test database connection
export async function testConnection() {
  try {
    console.log('Testing database connection...');
    await client`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check if vector extension is installed
    const vectorExt = await client`
      SELECT * FROM pg_extension WHERE extname = 'vector';
    `;
    console.log('Vector extension status:', vectorExt.length > 0 ? 'Installed' : 'Not installed');
    
    // Check embeddings table
    const tableInfo = await client`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'embeddings';
    `;
    console.log('Embeddings table exists:', tableInfo[0]?.count > 0);
    
    // Count embeddings
    const countResult = await client`SELECT COUNT(*) as count FROM embeddings;`;
    console.log('Total embeddings in database:', countResult[0]?.count || 0);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database
export async function initializeDatabase() {
  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Check if vector extension is installed
    const vectorExt = await client`
      SELECT * FROM pg_extension WHERE extname = 'vector';
    `;
    
    if (vectorExt.length === 0) {
      console.log('Installing vector extension...');
      await client`CREATE EXTENSION IF NOT EXISTS vector;`;
      console.log('✅ Vector extension installed');
    } else {
      console.log('✅ Vector extension already installed');
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

