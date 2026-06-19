import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Create a new comment (PUBLIC endpoint)
   * POST /comments/blog/:blogId
   * Body: CreateCommentDto
   * Status is always forced to PENDING at service level
   */
  @Post('blog/:blogId')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('blogId') blogId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    // Ensure blogId from URL is used
    createCommentDto.blogId = blogId;
    return this.commentsService.create(createCommentDto);
  }

  /**
   * Get comments for a specific blog with pagination and optional status filter
   * GET /comments/blog/:blogId?status=APPROVED&limit=50
   * Query Params:
   *   - page: number (default: 1)
   *   - limit: number (default: 10, max: 50)
   *   - status: PENDING | APPROVED | REJECTED (optional)
   * Public endpoint - no authentication required for viewing approved comments
   */
  @Get('blog/:blogId')
  findByBlogId(
    @Param('blogId') blogId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CommentStatus,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit
      ? Math.min(50, Math.max(1, parseInt(limit, 10)))
      : 10;

    return this.commentsService.findByBlogId(blogId, pageNum, limitNum, status);
  }

  /**
   * Get all comments with pagination and optional status filter (ADMIN only)
   * GET /comments?page=1&limit=10&status=PENDING
   * Query Params:
   *   - page: number (default: 1)
   *   - limit: number (default: 10, max: 50)
   *   - status: PENDING | APPROVED | REJECTED (optional)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CommentStatus,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit
      ? Math.min(50, Math.max(1, parseInt(limit, 10)))
      : 10;

    return this.commentsService.findAll(pageNum, limitNum, status);
  }

  /**
   * Update comment status (ADMIN only)
   * PATCH /comments/:id/status
   * Body: UpdateCommentStatusDto { status: 'APPROVED' | 'REJECTED' }
   * Allows transitions from APPROVED -> REJECTED
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCommentStatusDto,
  ) {
    return this.commentsService.updateStatus(id, updateStatusDto);
  }
}
