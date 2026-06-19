import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../common/prisma.service';

export interface JwtPayload {
  sub: string; // user id
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-development-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Validate that user still exists in database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }

    // This will be attached to request.user
    return {
      id: user.id,
      username: user.username,
    };
  }
}
