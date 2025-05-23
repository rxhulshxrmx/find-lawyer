import { Client } from "pg";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Lawyer {
  Name: string;
  Location: string;
  Experience: string;
  Languages: string;
  'Practice Areas'?: string;
  Specialization?: string;
  About?: string;
  Court?: string;
  'Profile Link'?: string;
  Rating?: string;
}

async function listLawyers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    
    // Get all lawyer records
    const result = await client.query(`
      SELECT id, content 
      FROM resources 
      WHERE content::text LIKE '%Name%' 
      AND content::text LIKE '%Experience%'
      ORDER BY (content::json->>'Name') ASC;
    `);
    
    if (result.rows.length === 0) {
      console.log("No lawyer records found in the resources table.");
      return;
    }
    
    console.log(`\nFound ${result.rows.length} lawyer records:\n`);
    
    // Parse and display lawyer information
    const lawyers: Lawyer[] = [];
    
    result.rows.forEach((row, index) => {
      try {
        const lawyer = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        lawyers.push(lawyer);
        
        console.log(`Lawyer #${index + 1} (ID: ${row.id}):`);
        console.log("-".repeat(60));
        console.log(`Name: ${lawyer.Name || 'N/A'}`);
        console.log(`Location: ${lawyer.Location || 'N/A'}`);
        console.log(`Experience: ${lawyer.Experience || 'N/A'} years`);
        console.log(`Practice Areas: ${lawyer['Practice Areas'] || lawyer.Specialization || 'N/A'}`);
        console.log(`Languages: ${lawyer.Languages || 'N/A'}`);
        console.log(`Court: ${lawyer.Court || 'N/A'}`);
        console.log(`About: ${lawyer.About || 'N/A'}`);
        if (lawyer['Profile Link']) {
          console.log(`Profile: ${lawyer['Profile Link']}`);
        }
        console.log();
      } catch (error) {
        console.error(`Error parsing lawyer data for record ${index + 1}:`, error);
      }
    });
    
    // Show some statistics
    console.log("\nStatistics:");
    console.log("===========");
    
    // Count by location
    const locations = new Map<string, number>();
    lawyers.forEach(lawyer => {
      const loc = lawyer.Location || 'Unknown';
      locations.set(loc, (locations.get(loc) || 0) + 1);
    });
    
    console.log("\nLawyers by Location:");
    locations.forEach((count, location) => {
      console.log(`- ${location}: ${count} lawyers`);
    });
    
    // Count by specialization
    const specializations = new Map<string, number>();
    lawyers.forEach(lawyer => {
      const specs = (lawyer.Specialization || '').split(',').map(s => s.trim());
      specs.forEach(spec => {
        if (spec) {
          specializations.set(spec, (specializations.get(spec) || 0) + 1);
        }
      });
    });
    
    console.log("\nLawyers by Specialization:");
    specializations.forEach((count, spec) => {
      console.log(`- ${spec}: ${count} lawyers`);
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error listing lawyers:", errorMessage);
  } finally {
    await client.end();
  }
}

console.log("Listing lawyers from resources table...");
listLawyers().catch(console.error);
