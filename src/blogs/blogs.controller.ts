import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  /**
   * Create a new blog
   * POST /blogs
   * Body: CreateBlogDto
   * Protected: Requires JWT authentication
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  /**
   * Get all blogs with pagination and search
   * GET /blogs?page=1&limit=10&search=title
   * Query Params:
   *   - page: number (default: 1)
   *   - limit: number (default: 10, max: 100)
   *   - search: string (optional, searches title and excerpt)
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 10;

    return this.blogsService.findAll(pageNum, limitNum, search);
  }

  /**
   * Get a single blog by slug with related images
   * GET /blogs/:slug
   * Note: Uses slug instead of ID for better UX and SEO
   */
  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.blogsService.findOneBySlug(slug);
  }

  /**
   * Update a blog by ID
   * PATCH /blogs/:id
   * Body: UpdateBlogDto (partial)
   * Protected: Requires JWT authentication
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(id, updateBlogDto);
  }

  /**
   * Delete a blog by ID
   * DELETE /blogs/:id
   * Returns 204 No Content on success
   * Protected: Requires JWT authentication
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
