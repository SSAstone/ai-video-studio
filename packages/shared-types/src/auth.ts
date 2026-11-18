export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
    isEmailVerified: boolean;
  };
  currentWorkspace: {
    id: string;
    name: string;
    role: WorkspaceRole;
  };
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  workspaceId?: string;
  iat?: number;
  exp?: number;
}

