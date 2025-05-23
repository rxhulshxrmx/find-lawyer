import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { db } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';
import { embeddings } from '@/lib/db/schema/embeddings';
import { generateEmbedding } from '@/lib/ai/embedding';
import { sql } from 'drizzle-orm';

interface Lawyer {
  Name: string;
  Location: string;
  Experience: string;
  Languages: string;
  'Practice Areas': string;
  About: string;
  Court: string;
  'Profile Link': string;
}

async function importLawyers() {
  try {
    console.log('Reading CSV file...');
    const fileContent = readFileSync(process.cwd() + '/Advocate_data.csv', 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }) as Lawyer[];

    console.log(`Found ${records.length} lawyers in CSV`);

    // Process lawyers in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(records.length / BATCH_SIZE)}`);

      await Promise.all(batch.map(async (lawyer) => {
        try {
          // Create a text representation of the lawyer's information
          const lawyerText = `
            Name: ${lawyer.Name}
            Location: ${lawyer.Location}
            Experience: ${lawyer.Experience || 'N/A'} years
            Languages: ${lawyer.Languages || 'N/A'}
            Practice Areas: ${lawyer['Practice Areas'] || 'N/A'}
            About: ${lawyer.About || 'N/A'}
            Court: ${lawyer.Court || 'N/A'}
            Profile: ${lawyer['Profile Link'] || 'N/A'}
          `.trim();

          // Insert into resources table
          const [resource] = await db.insert(resources).values({
            content: JSON.stringify(lawyer)
          }).returning();

          // Generate embedding
          const embedding = await generateEmbedding(lawyerText);

          // Insert into embeddings table
          await db.insert(embeddings).values({
            resourceId: resource.id,
            content: JSON.stringify(lawyer),
            embedding: sql`${JSON.stringify(embedding)}::vector`
          });

          console.log(`✅ Processed lawyer: ${lawyer.Name}`);
        } catch (error) {
          console.error(`❌ Error processing lawyer ${lawyer.Name}:`, error);
        }
      }));
    }

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error importing lawyers:', error);
    process.exit(1);
  }
}

// Run the import
importLawyers(); 