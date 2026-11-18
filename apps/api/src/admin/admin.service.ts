import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { users, workspaces, projects, renderJobs, mediaAssets } from '../database/schema';
import { count } from 'drizzle-orm';

@Injectable()
export class AdminService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSystemStats() {
    if (this.databaseService.isHealthy) {
      const [userCount] = await this.databaseService.db.select({ value: count() }).from(users);
      const [workspaceCount] = await this.databaseService.db.select({ value: count() }).from(workspaces);
      const [projectCount] = await this.databaseService.db.select({ value: count() }).from(projects);
      const [jobCount] = await this.databaseService.db.select({ value: count() }).from(renderJobs);
      const [mediaCount] = await this.databaseService.db.select({ value: count() }).from(mediaAssets);

      return {
        totalUsers: Number(userCount.value),
        totalWorkspaces: Number(workspaceCount.value),
        totalProjects: Number(projectCount.value),
        totalRenderJobs: Number(jobCount.value),
        totalMediaAssets: Number(mediaCount.value),
        systemStatus: 'healthy',
        activeWorkers: 1,
        ffmpegStatus: 'available',
      };
    }

    return {
      totalUsers: 1,
      totalWorkspaces: 1,
      totalProjects: 3,
      totalRenderJobs: 1,
      totalMediaAssets: 5,
      systemStatus: 'local_development',
      activeWorkers: 1,
      ffmpegStatus: 'available',
    };
  }
}

