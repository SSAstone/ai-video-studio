import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;
  public db!: NodePgDatabase<typeof schema>;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const connectionString =
      this.configService.get<string>('DATABASE_URL') ||
      'postgresql://postgres:postgres@localhost:5432/ai_video_studio';

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.db = drizzle(this.pool, { schema });

    try {
      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      this.logger.log('Connected to PostgreSQL successfully.');
    } catch (error: any) {
      this.logger.warn(
        `PostgreSQL not reachable at ${connectionString.split('@')[1] || connectionString}: ${error.message}. Local dev fallback active.`
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  get isHealthy(): boolean {
    return this.isConnected;
  }
}
