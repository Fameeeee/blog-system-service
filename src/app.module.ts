import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlogsModule } from './blogs/blogs.module';
import { CommentsModule } from './comments/comments.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [AuthModule, BlogsModule, CommentsModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
