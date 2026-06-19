import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Bootstrap admin user on application startup
   * Creates default admin if no users exist in the database
   */
  async onModuleInit() {
    try {
      const userCount = await this.prisma.user.count();

      if (userCount === 0) {
        this.logger.log('No users found. Creating default admin user...');

        const hashedPassword = await bcrypt.hash('password123', this.SALT_ROUNDS);

        await this.prisma.user.create({
          data: {
            username: 'admin',
            password_hash: hashedPassword,
          },
        });

        this.logger.log('✅ Default admin user created (username: admin, password: password123)');
      }
    } catch (error) {
      this.logger.error('Failed to initialize admin user:', error);
    }
  }

  /**
   * Authenticate user and generate JWT token
   * Returns access token on successful login
   * Prevents timing attacks by using constant-time operations
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { username, password } = loginDto;

    // Retrieve user from database
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password_hash: true,
      },
    });

    // Use constant-time comparison to prevent timing attacks
    // Always perform bcrypt.compare even if user doesn't exist
    const passwordToCompare = user?.password_hash || '';
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    // Prevent revealing whether username exists or password failed
    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }
}
