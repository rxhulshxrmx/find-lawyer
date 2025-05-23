// Simple JavaScript to check database connection
const { db } = require('../lib/db');
const { sql } = require('drizzle-orm');

async function checkDb() {
  try {
    console.log('Testing database connection...');
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    console.log('Test query result:', result[0]);
    
    // Try to get embeddings count
    try {
      const count = await db.execute(sql`SELECT COUNT(*) as count FROM embeddings`);
      console.log('\nEmbeddings count:', count[0].count);
      
      if (count[0].count > 0) {
        const sample = await db.execute(sql`SELECT * FROM embeddings LIMIT 1`);
        console.log('\nSample embedding:');
        console.log({
          id: sample[0].id,
          content: sample[0].content ? sample[0].content.substring(0, 100) + '...' : 'No content',
          hasEmbedding: !!sample[0].embedding
        });
      }
    } catch (e) {
      console.log('\n❌ Error querying embeddings table:', e.message);
      console.log('This might be expected if the table does not exist yet.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDb().catch(console.error);
