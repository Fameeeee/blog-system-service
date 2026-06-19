import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new comment (public endpoint)
   * SECURITY: Always force status to PENDING regardless of user input
   * @param blogId - Blog ID from URL parameter
   * @param createCommentDto - Contains only senderName and content from request body
   */
  async create(blogId: string, createCommentDto: CreateCommentDto) {
    const { senderName, content } = createCommentDto;

    // Verify blog exists
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { id: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }

    // Create comment with FORCED PENDING status for security
    const comment = await this.prisma.comment.create({
      data: {
        blogId,
        senderName,
        content,
        status: CommentStatus.PENDING, // Force PENDING - never trust user input
      },
      select: {
        id: true,
        blogId: true,
        senderName: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Comment submitted successfully and is pending approval',
      comment,
    };
  }

  /**
   * Get all comments with pagination and optional status filter (admin only)
   * Supports filtering by status: PENDING, APPROVED, REJECTED
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: CommentStatus,
  ) {
    const skip = (page - 1) * limit;

    // Build filter
    const where = status ? { status } : {};

    // Get total count
    const total = await this.prisma.comment.count({ where });

    // Get paginated comments
    const comments = await this.prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update comment status (admin only)
   * BUSINESS LOGIC: Allows transitions from APPROVED -> REJECTED
   */
  async updateStatus(id: string, updateStatusDto: UpdateCommentStatusDto) {
    const { status } = updateStatusDto;

    // Verify comment exists
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Update status - allows all transitions including APPROVED -> REJECTED
    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        blogId: true,
        senderName: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: `Comment status updated to ${status}`,
      comment: updatedComment,
    };
  }

  /**
   * Get comments for a specific blog with pagination and optional status filter
   * GET /comments/blog/:blogId?status=APPROVED&limit=50
   * Query Params:
   *   - page: number (default: 1)
   *   - limit: number (default: 10, max: 50)
   *   - status: PENDING | APPROVED | REJECTED (optional)
   */
  async findByBlogId(
    blogId: string,
    page: number = 1,
    limit: number = 10,
    status?: CommentStatus,
  ) {
    if (!blogId || !blogId.trim()) {
      throw new BadRequestException('Blog ID cannot be empty');
    }

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    if (limit > 50) {
      throw new BadRequestException('Limit must not exceed 50');
    }

    // Verify blog exists
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { id: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }

    const skip = (page - 1) * limit;

    // Build filter with blogId and optional status
    const where = status ? { blogId, status } : { blogId };

    // Get total count
    const total = await this.prisma.comment.count({ where });

    // Get paginated comments
    const comments = await this.prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        blogId: true,
        senderName: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
