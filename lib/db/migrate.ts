import { env } from "@/lib/env.mjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

const runMigrate = async () => {
  if (!env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is not defined. Skipping migrations.");
    process.exit(0);
  }

  try {
    const connection = postgres(env.DATABASE_URL, { 
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connect_timeout: 10
    });

    const db = drizzle(connection);
    console.log("⏳ Running migrations...");
    const start = Date.now();

    await migrate(db, { migrationsFolder: "lib/db/migrations" });

    const end = Date.now();
    console.log("✅ Migrations completed in", end - start, "ms");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed");
    if (error instanceof Error) {
      console.error(error.message);
    }
    // Don't fail the build if migrations fail in production
    if (process.env.NODE_ENV === 'production') {
      console.log("⚠️ Continuing build without migrations...");
      process.exit(0);
    }
    process.exit(1);
  }
};

void runMigrate();
