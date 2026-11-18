import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import { renderJobs, projects } from '../database/schema';
import { RenderJobStatus, RenderOptions, RenderJobDto } from '@ai-video-studio/shared-types';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Timeline } from '@ai-video-studio/video-schema';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class RenderingService {
  private readonly logger = new Logger(RenderingService.name);
  private readonly memoryJobs = new Map<string, any>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService
  ) {}

  async queueRender(
    projectId: string,
    workspaceId: string,
    userId: string,
    options: RenderOptions
  ): Promise<RenderJobDto> {
    const jobId = uuidv4();

    // Verify project exists
    let projectTimeline: Timeline;
    if (this.databaseService.isHealthy) {
      const [proj] = await this.databaseService.db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!proj) throw new NotFoundException('Project not found');
      projectTimeline = proj.timeline as Timeline;
    } else {
      projectTimeline = {
        id: projectId,
        name: 'Project',
        width: options.width,
        height: options.height,
        fps: options.fps,
        duration: 30,
        backgroundColor: '#000000',
        tracks: [],
        version: 1,
      };
    }

    const jobData: any = {
      id: jobId,
      projectId,
      workspaceId,
      userId,
      status: RenderJobStatus.QUEUED,
      progress: 0,
      currentFrame: 0,
      totalFrames: Math.round((projectTimeline.duration || 30) * (options.fps || 30)),
      options: options as any,
      outputStorageKey: null,
      outputUrl: null,
      outputSizeBytes: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.databaseService.isHealthy) {
      await this.databaseService.db.insert(renderJobs).values(jobData);
    } else {
      this.memoryJobs.set(jobId, jobData);
    }

    this.logger.log(`Queued render job ${jobId} for project ${projectId}`);
    return jobData;
  }

  async getJob(jobId: string): Promise<RenderJobDto> {
    if (this.databaseService.isHealthy) {
      const [job] = await this.databaseService.db
        .select()
        .from(renderJobs)
        .where(eq(renderJobs.id, jobId))
        .limit(1);

      if (!job) throw new NotFoundException('Render job not found');
      return job as any;
    }

    const job = this.memoryJobs.get(jobId);
    if (!job) throw new NotFoundException('Render job not found');
    return job;
  }

  async updateJobProgress(jobId: string, progress: number, currentFrame?: number) {
    if (this.databaseService.isHealthy) {
      await this.databaseService.db
        .update(renderJobs)
        .set({
          progress,
          currentFrame,
          status: progress >= 100 ? RenderJobStatus.COMPLETED : RenderJobStatus.PROCESSING,
          updatedAt: new Date(),
        })
        .where(eq(renderJobs.id, jobId));
    } else {
      const job = this.memoryJobs.get(jobId);
      if (job) {
        job.progress = progress;
        job.currentFrame = currentFrame;
        job.status = progress >= 100 ? RenderJobStatus.COMPLETED : RenderJobStatus.PROCESSING;
        this.memoryJobs.set(jobId, job);
      }
    }
  }

  async completeJob(jobId: string, storageKey: string, sizeBytes: number) {
    const url = await this.storageService.getUrl(storageKey);
    if (this.databaseService.isHealthy) {
      await this.databaseService.db
        .update(renderJobs)
        .set({
          status: RenderJobStatus.COMPLETED,
          progress: 100,
          outputStorageKey: storageKey,
          outputUrl: url,
          outputSizeBytes: sizeBytes,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(renderJobs.id, jobId));
    } else {
      const job = this.memoryJobs.get(jobId);
      if (job) {
        job.status = RenderJobStatus.COMPLETED;
        job.progress = 100;
        job.outputStorageKey = storageKey;
        job.outputUrl = url;
        job.outputSizeBytes = sizeBytes;
        job.completedAt = new Date();
        this.memoryJobs.set(jobId, job);
      }
    }
  }

  async cancelJob(jobId: string) {
    if (this.databaseService.isHealthy) {
      await this.databaseService.db
        .update(renderJobs)
        .set({ status: RenderJobStatus.CANCELLED, updatedAt: new Date() })
        .where(eq(renderJobs.id, jobId));
    } else {
      const job = this.memoryJobs.get(jobId);
      if (job) {
        job.status = RenderJobStatus.CANCELLED;
        this.memoryJobs.set(jobId, job);
      }
    }
    return { success: true };
  }

  async getProjectJobs(projectId: string) {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db
        .select()
        .from(renderJobs)
        .where(eq(renderJobs.projectId, projectId))
        .orderBy(desc(renderJobs.createdAt));
    }
    return Array.from(this.memoryJobs.values()).filter((j) => j.projectId === projectId);
  }
}

