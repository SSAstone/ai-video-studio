import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { workspaces, workspaceMembers, users } from '../database/schema';
import { WorkspaceRole } from '@ai-video-studio/shared-types';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);
  private readonly memoryWorkspaces = new Map<string, any>();
  private readonly memoryMembers = new Map<string, any[]>();

  constructor(private readonly databaseService: DatabaseService) {}

  async getUserWorkspaces(userId: string) {
    if (this.databaseService.isHealthy) {
      const records = await this.databaseService.db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          creditBalance: workspaces.creditBalance,
          role: workspaceMembers.role,
          createdAt: workspaces.createdAt,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, userId));

      return records;
    }

    return Array.from(this.memoryWorkspaces.values()).filter((ws) => {
      const members = this.memoryMembers.get(ws.id) || [];
      return members.some((m) => m.userId === userId);
    });
  }

  async getWorkspaceById(workspaceId: string) {
    if (this.databaseService.isHealthy) {
      const [workspace] = await this.databaseService.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }
      return workspace;
    }

    const ws = this.memoryWorkspaces.get(workspaceId);
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async createWorkspace(userId: string, name: string) {
    const id = uuidv4();
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;

    const data = {
      id,
      name,
      slug,
      ownerId: userId,
      creditBalance: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.databaseService.isHealthy) {
      await this.databaseService.db.transaction(async (tx: any) => {
        await tx.insert(workspaces).values(data as any);
        await tx.insert(workspaceMembers).values({
          id: uuidv4(),
          workspaceId: id,
          userId,
          role: WorkspaceRole.OWNER,
        });
      });
    } else {
      this.memoryWorkspaces.set(id, data);
      this.memoryMembers.set(id, [{ id: uuidv4(), workspaceId: id, userId, role: WorkspaceRole.OWNER }]);
    }

    return data;
  }

  async getWorkspaceMembers(workspaceId: string) {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db
        .select({
          id: workspaceMembers.id,
          role: workspaceMembers.role,
          userId: users.id,
          email: users.email,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId));
    }
    return this.memoryMembers.get(workspaceId) || [];
  }
}
