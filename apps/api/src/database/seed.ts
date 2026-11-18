import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';
import { UserRole, WorkspaceRole } from '@ai-video-studio/shared-types';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function seed() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_video_studio';
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log('Seeding initial data...');

  try {
    // 1. Seed Plans
    const freePlanId = uuidv4();
    const proPlanId = uuidv4();

    await db
      .insert(schema.plans)
      .values([
        {
          id: freePlanId,
          name: 'Starter Free',
          code: 'free',
          monthlyCredits: 100,
          maxResolution: '1080p',
          maxStorageMb: 2000,
          priceMonthlyCents: 0,
          features: ['1080p MP4 Export', 'Basic AI Prompts', '100 Credits/mo', '2GB Storage'],
          isActive: true,
        },
        {
          id: proPlanId,
          name: 'Pro Creator',
          code: 'pro',
          monthlyCredits: 1000,
          maxResolution: '4k',
          maxStorageMb: 50000,
          priceMonthlyCents: 1900,
          features: ['4K MP4 Export', 'Unlimited AI Editing Plans', 'Auto Subtitles', 'Silence Removal', '50GB Storage'],
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    // 2. Seed Default Admin User
    const adminId = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123456', salt);

    await db
      .insert(schema.users)
      .values({
        id: adminId,
        email: 'admin@aivideostudio.local',
        passwordHash,
        fullName: 'Studio Admin',
        role: UserRole.SUPER_ADMIN,
        isEmailVerified: true,
      })
      .onConflictDoNothing();

    // 3. Seed Default Workspace
    const workspaceId = uuidv4();
    await db
      .insert(schema.workspaces)
      .values({
        id: workspaceId,
        name: 'Default Studio Workspace',
        slug: 'default-studio-workspace',
        ownerId: adminId,
        creditBalance: 1000,
      })
      .onConflictDoNothing();

    await db
      .insert(schema.workspaceMembers)
      .values({
        id: uuidv4(),
        workspaceId,
        userId: adminId,
        role: WorkspaceRole.OWNER,
      })
      .onConflictDoNothing();

    console.log('Seed completed successfully!');
    console.log('Default Admin: admin@aivideostudio.local / admin123456');
  } catch (error: any) {
    console.error('Seed error:', error.message);
  } finally {
    await pool.end();
  }
}

seed();
