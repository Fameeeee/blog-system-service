import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [BlogsController],
  providers: [BlogsService, PrismaService],
  exports: [PrismaService],
})
export class BlogsModule {}
