import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { users, workspaces, workspaceMembers, creditTransactions } from '../database/schema';
import { RegisterDto, LoginDto, UserRole, WorkspaceRole, AuthSession } from '@ai-video-studio/shared-types';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  // Local fallback storage when DB is offline
  private readonly memoryUsers = new Map<string, any>();
  private readonly memoryWorkspaces = new Map<string, any>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = dto.email.toLowerCase().trim();

    // Check if user exists
    if (this.databaseService.isHealthy) {
      const [existing] = await this.databaseService.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        throw new ConflictException('An account with this email already exists');
      }
    } else if (this.memoryUsers.has(email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const userId = uuidv4();
    const workspaceId = uuidv4();
    const workspaceName = `${dto.fullName.split(' ')[0]}'s Workspace`;
    const workspaceSlug = `${email.split('@')[0]}-${Math.random().toString(36).substring(2, 6)}`;

    if (this.databaseService.isHealthy) {
      // Transactional creation of User + Workspace + Member + Welcome Credits
      await this.databaseService.db.transaction(async (tx: any) => {
        await tx.insert(users).values({
          id: userId,
          email,
          fullName: dto.fullName,
          passwordHash,
          role: UserRole.USER,
          isEmailVerified: true,
        });

        await tx.insert(workspaces).values({
          id: workspaceId,
          name: workspaceName,
          slug: workspaceSlug,
          ownerId: userId,
          creditBalance: 100, // 100 starting credits
        });

        await tx.insert(workspaceMembers).values({
          id: uuidv4(),
          workspaceId,
          userId,
          role: WorkspaceRole.OWNER,
        });

        await tx.insert(creditTransactions).values({
          id: uuidv4(),
          workspaceId,
          amount: 100,
          balanceAfter: 100,
          type: 'subscription_grant',
          description: 'Welcome bonus credits',
        });
      });
    } else {
      const userRecord = {
        id: userId,
        email,
        fullName: dto.fullName,
        passwordHash,
        role: UserRole.USER,
        isEmailVerified: true,
      };
      const workspaceRecord = {
        id: workspaceId,
        name: workspaceName,
        slug: workspaceSlug,
        ownerId: userId,
        role: WorkspaceRole.OWNER,
      };
      this.memoryUsers.set(email, userRecord);
      this.memoryWorkspaces.set(workspaceId, workspaceRecord);
    }

    return this.createAuthSession({
      id: userId,
      email,
      fullName: dto.fullName,
      role: UserRole.USER,
      workspaceId,
      workspaceName,
    });
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = dto.email.toLowerCase().trim();
    let user: any = null;
    let workspace: any = null;

    if (this.databaseService.isHealthy) {
      const [dbUser] = await this.databaseService.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!dbUser) {
        throw new UnauthorizedException('Invalid email or password');
      }

      user = dbUser;

      // Find primary workspace
      const [member] = await this.databaseService.db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, user.id))
        .limit(1);

      if (member) {
        const [ws] = await this.databaseService.db
          .select()
          .from(workspaces)
          .where(eq(workspaces.id, member.workspaceId))
          .limit(1);
        workspace = { ...ws, role: member.role };
      }
    } else {
      user = this.memoryUsers.get(email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
      for (const ws of this.memoryWorkspaces.values()) {
        if (ws.ownerId === user.id) {
          workspace = ws;
          break;
        }
      }
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthSession({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      workspaceId: workspace?.id || uuidv4(),
      workspaceName: workspace?.name || 'Default Workspace',
    });
  }

  async refreshToken(token: string): Promise<AuthSession> {
    try {
      const decoded = this.jwtService.verify(token);
      let user: any = null;

      if (this.databaseService.isHealthy) {
        const [dbUser] = await this.databaseService.db
          .select()
          .from(users)
          .where(eq(users.id, decoded.sub))
          .limit(1);
        user = dbUser;
      } else {
        user = this.memoryUsers.get(decoded.email);
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.createAuthSession({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        workspaceId: decoded.workspaceId || uuidv4(),
        workspaceName: 'Current Workspace',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private createAuthSession(params: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
    workspaceId: string;
    workspaceName: string;
  }): AuthSession {
    const payload = {
      sub: params.id,
      email: params.email,
      role: params.role,
      workspaceId: params.workspaceId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: {
        id: params.id,
        email: params.email,
        fullName: params.fullName,
        role: params.role,
        avatarUrl: params.avatarUrl,
        isEmailVerified: true,
      },
      currentWorkspace: {
        id: params.workspaceId,
        name: params.workspaceName,
        role: WorkspaceRole.OWNER,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
      },
    };
  }
}
