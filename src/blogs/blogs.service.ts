import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a URL-friendly slug from a title
   * Removes special characters, converts to lowercase, and replaces spaces with hyphens
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Create a new blog with associated images in a transaction
   * ACID compliance: All-or-nothing operation
   */
  async create(createBlogDto: CreateBlogDto) {
    const {
      title,
      excerpt,
      content,
      coverImageUrl,
      additionalImages = [],
      slug: providedSlug,
    } = createBlogDto;

    if (!title || !title.trim()) {
      throw new BadRequestException('Title cannot be empty');
    }

    const slug = providedSlug ? providedSlug.toLowerCase().trim() : this.generateSlug(title);

    if (!slug) {
      throw new BadRequestException('Could not generate a valid slug from the provided title');
    }

    try {
      // Use transaction for ACID compliance
      const blog = await this.prisma.$transaction(async (tx) => {
        // Check if slug already exists
        const existingSlug = await tx.blog.findUnique({
          where: { slug },
        });

        if (existingSlug) {
          throw new ConflictException('Slug already exists');
        }

        // Create blog with nested image creation
        return tx.blog.create({
          data: {
            title,
            slug,
            excerpt,
            content,
            coverImageUrl,
            images: {
              create: additionalImages.map((imageUrl) => ({
                imageUrl,
              })),
            },
          },
          include: {
            images: true,
          },
        });
      });

      return {
        success: true,
        data: blog,
        message: 'Blog created successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Slug already exists');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to create blog: ' + errorMessage);
    }
  }

  /**
   * Find all blogs with pagination and search
   * Returns: { data: [...], meta: { total, page, limit } }
   */
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    if (limit > 100) {
      throw new BadRequestException('Limit must not exceed 100');
    }

    const skip = (page - 1) * limit;

    const whereClause: Prisma.BlogWhereInput = search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              excerpt: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    try {
      const [blogs, total] = await Promise.all([
        this.prisma.blog.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            images: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.blog.count({
          where: whereClause,
        }),
      ]);

      return {
        data: blogs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to fetch blogs: ' + errorMessage);
    }
  }

  /**
   * Find a single blog by slug with related images (N+1 query prevention)
   */
  async findOneBySlug(slug: string) {
    if (!slug || !slug.trim()) {
      throw new BadRequestException('Slug cannot be empty');
    }

    try {
      const blog = await this.prisma.blog.findUnique({
        where: { slug: slug.toLowerCase().trim() },
        include: {
          images: true,
        },
      });

      if (!blog) {
        throw new NotFoundException(`Blog with slug "${slug}" not found`);
      }

      return blog;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to fetch blog: ' + errorMessage);
    }
  }

  /**
   * Update a blog and its associated images with transaction support
   * ACID compliance: All-or-nothing operation
   */
  async update(id: string, updateBlogDto: UpdateBlogDto) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Blog ID cannot be empty');
    }

    try {
      // Check if blog exists
      const existingBlog = await this.prisma.blog.findUnique({
        where: { id },
      });

      if (!existingBlog) {
        throw new NotFoundException(`Blog with ID "${id}" not found`);
      }

      const {
        title,
        excerpt,
        content,
        coverImageUrl,
        additionalImages,
        slug: newSlug,
        status,
      } = updateBlogDto;

      // Prepare update data
      const updateData: Prisma.BlogUpdateInput = {};

      if (title !== undefined) updateData.title = title;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (content !== undefined) updateData.content = content;
      if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
      if (status !== undefined) updateData.status = status;

      // Handle slug uniqueness check if provided
      if (newSlug !== undefined) {
        const slugLower = newSlug.toLowerCase().trim();

        if (!slugLower) {
          throw new BadRequestException('Slug cannot be empty or only whitespace');
        }

        // Check if new slug is different and already exists
        if (slugLower !== existingBlog.slug) {
          const existingSlug = await this.prisma.blog.findUnique({
            where: { slug: slugLower },
          });

          if (existingSlug) {
            throw new ConflictException('Slug already exists');
          }
        }

        updateData.slug = slugLower;
      }

      // Use transaction for handling images update
      const updatedBlog = await this.prisma.$transaction(async (tx) => {
        // Update blog data
        const blog = await tx.blog.update({
          where: { id },
          data: updateData,
          include: {
            images: true,
          },
        });

        // If additionalImages provided, replace all images
        if (additionalImages !== undefined) {
          // Delete existing images
          await tx.blogImage.deleteMany({
            where: { blogId: id },
          });

          // Create new images
          if (additionalImages.length > 0) {
            await tx.blogImage.createMany({
              data: additionalImages.map((imageUrl) => ({
                blogId: id,
                imageUrl,
              })),
            });
          }

          // Fetch updated blog with new images
          return tx.blog.findUnique({
            where: { id },
            include: {
              images: true,
            },
          });
        }

        return blog;
      });

      return {
        success: true,
        data: updatedBlog,
        message: 'Blog updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Slug already exists');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to update blog: ' + errorMessage);
    }
  }

  /**
   * Delete a blog by ID
   * Relies on Prisma cascade delete for related images and comments
   */
  async remove(id: string) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Blog ID cannot be empty');
    }

    try {
      // Check if blog exists
      const blog = await this.prisma.blog.findUnique({
        where: { id },
      });

      if (!blog) {
        throw new NotFoundException(`Blog with ID "${id}" not found`);
      }

      // Delete blog (cascade will handle related images and comments)
      await this.prisma.blog.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Blog deleted successfully',
        deletedBlogId: id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to delete blog: ' + errorMessage);
    }
  }
}
