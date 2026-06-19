import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/create-auth.dto';

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

  /**
   * Register new user account
   * Validates username uniqueness and creates user with hashed password
   * Returns JWT token for immediate login after registration
   */
  async register(createAuthDto: CreateAuthDto): Promise<{ access_token: string; username: string }> {
    const { username, password } = createAuthDto;

    // Validate password strength
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        username,
        password_hash: hashedPassword,
      },
      select: {
        id: true,
        username: true,
      },
    });

    // Generate JWT token for immediate login
    const payload = {
      sub: newUser.id,
      username: newUser.username,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`New user registered: ${newUser.username}`);

    return {
      access_token: accessToken,
      username: newUser.username,
    };
  }
}
