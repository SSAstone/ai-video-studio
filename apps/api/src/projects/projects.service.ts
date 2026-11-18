import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { projects, editorVersions, workspaces } from '../database/schema';
import { Timeline, AspectRatioPreset, AspectRatioType } from '@ai-video-studio/video-schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProjectDto {
  workspaceId: string;
  name: string;
  aspectRatio?: AspectRatioType;
  duration?: number;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  // Memory store fallback
  private readonly memoryProjects = new Map<string, any>();
  private readonly memoryVersions = new Map<string, any[]>();

  constructor(private readonly databaseService: DatabaseService) {}

  async createProject(userId: string, dto: CreateProjectDto) {
    const projectId = uuidv4();
    const preset = dto.aspectRatio
      ? AspectRatioPreset[dto.aspectRatio] || AspectRatioPreset.LANDSCAPE_16_9
      : AspectRatioPreset.LANDSCAPE_16_9;

    const track1Id = uuidv4();
    const track2Id = uuidv4();
    const track3Id = uuidv4();

    const initialTimeline: Timeline = {
      id: projectId,
      name: dto.name || 'Untitled Video',
      width: preset.width,
      height: preset.height,
      fps: 30,
      duration: dto.duration || 30,
      backgroundColor: '#000000',
      tracks: [
        {
          id: track1Id,
          type: 'video',
          name: 'Video 1',
          index: 0,
          isLocked: false,
          isMuted: false,
          isVisible: true,
          clips: [],
        },
        {
          id: track2Id,
          type: 'audio',
          name: 'Audio 1',
          index: 1,
          isLocked: false,
          isMuted: false,
          isVisible: true,
          clips: [],
        },
        {
          id: track3Id,
          type: 'text',
          name: 'Text & Titles',
          index: 2,
          isLocked: false,
          isMuted: false,
          isVisible: true,
          clips: [],
        },
      ],
      version: 1,
    };

    const projectData = {
      id: projectId,
      workspaceId: dto.workspaceId,
      name: dto.name || 'Untitled Video',
      description: null,
      aspectRatio: dto.aspectRatio || 'LANDSCAPE_16_9',
      width: preset.width,
      height: preset.height,
      fps: 30,
      duration: dto.duration || 30,
      timeline: initialTimeline,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.databaseService.isHealthy) {
      await this.databaseService.db.transaction(async (tx: any) => {
        await tx.insert(projects).values(projectData as any);
        await tx.insert(editorVersions).values({
          id: uuidv4(),
          projectId,
          userId,
          versionNumber: 1,
          timeline: initialTimeline,
          changeSummary: 'Initial project creation',
        });
      });
    } else {
      this.memoryProjects.set(projectId, projectData);
      this.memoryVersions.set(projectId, [
        {
          id: uuidv4(),
          projectId,
          userId,
          versionNumber: 1,
          timeline: initialTimeline,
          changeSummary: 'Initial project creation',
          createdAt: new Date(),
        },
      ]);
    }

    return projectData;
  }

  async getWorkspaceProjects(workspaceId: string) {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db
        .select()
        .from(projects)
        .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false)))
        .orderBy(desc(projects.updatedAt));
    }

    return Array.from(this.memoryProjects.values()).filter(
      (p) => p.workspaceId === workspaceId && !p.isArchived
    );
  }

  async getProjectById(projectId: string) {
    if (this.databaseService.isHealthy) {
      const [project] = await this.databaseService.db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
      return project;
    }

    const project = this.memoryProjects.get(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    return project;
  }

  async updateTimeline(
    projectId: string,
    timeline: Timeline,
    userId?: string,
    changeSummary?: string
  ) {
    const existing = await this.getProjectById(projectId);
    const newVersionNumber = ((existing.timeline as Timeline)?.version || 0) + 1;
    const updatedTimeline: Timeline = {
      ...timeline,
      version: newVersionNumber,
    };

    if (this.databaseService.isHealthy) {
      await this.databaseService.db.transaction(async (tx: any) => {
        await tx
          .update(projects)
          .set({
            timeline: updatedTimeline,
            duration: timeline.duration,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        await tx.insert(editorVersions).values({
          id: uuidv4(),
          projectId,
          userId: userId || null,
          versionNumber: newVersionNumber,
          timeline: updatedTimeline,
          changeSummary: changeSummary || 'Autosave edit',
        });
      });
    } else {
      existing.timeline = updatedTimeline;
      existing.duration = timeline.duration;
      existing.updatedAt = new Date();
      this.memoryProjects.set(projectId, existing);

      const versions = this.memoryVersions.get(projectId) || [];
      versions.push({
        id: uuidv4(),
        projectId,
        userId: userId || null,
        versionNumber: newVersionNumber,
        timeline: updatedTimeline,
        changeSummary: changeSummary || 'Autosave edit',
        createdAt: new Date(),
      });
      this.memoryVersions.set(projectId, versions);
    }

    return {
      success: true,
      version: newVersionNumber,
      timeline: updatedTimeline,
    };
  }

  async updateProjectMeta(projectId: string, updates: { name?: string; description?: string; aspectRatio?: string }) {
    const project = await this.getProjectById(projectId);

    if (this.databaseService.isHealthy) {
      const [updated] = await this.databaseService.db
        .update(projects)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning();
      return updated;
    }

    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.memoryProjects.set(projectId, updated);
    return updated;
  }

  async deleteProject(projectId: string) {
    if (this.databaseService.isHealthy) {
      await this.databaseService.db
        .update(projects)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(projects.id, projectId));
    } else {
      const p = this.memoryProjects.get(projectId);
      if (p) {
        p.isArchived = true;
        this.memoryProjects.set(projectId, p);
      }
    }
    return { success: true };
  }

  async duplicateProject(projectId: string, userId: string) {
    const original = await this.getProjectById(projectId);
    const newId = uuidv4();
    const clonedTimeline: Timeline = {
      ...(original.timeline as Timeline),
      id: newId,
      name: `${original.name} (Copy)`,
      version: 1,
    };

    return this.createProject(userId, {
      workspaceId: original.workspaceId,
      name: `${original.name} (Copy)`,
      aspectRatio: original.aspectRatio as AspectRatioType,
      duration: original.duration,
    });
  }

  async getProjectVersions(projectId: string) {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db
        .select()
        .from(editorVersions)
        .where(eq(editorVersions.projectId, projectId))
        .orderBy(desc(editorVersions.versionNumber));
    }
    return (this.memoryVersions.get(projectId) || []).slice().reverse();
  }
}
