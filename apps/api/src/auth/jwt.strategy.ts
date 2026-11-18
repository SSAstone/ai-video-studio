import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@ai-video-studio/shared-types';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'super-secret-jwt-key-for-local-ai-video-studio-development-32chars!',
    });
  }

  async validate(payload: JwtPayload) {
    if (!this.databaseService.isHealthy) {
      // Local development mock user fallback
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        fullName: 'Local Developer',
      };
    }

    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    };
  }
}

