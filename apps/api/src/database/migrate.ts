import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_video_studio';

  console.log(`Running migrations against: ${connectionString.split('@')[1] || connectionString}`);

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
    console.log('Migrations executed successfully!');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigrations();
