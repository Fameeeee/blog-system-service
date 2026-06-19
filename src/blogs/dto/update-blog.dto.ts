import {
  IsString,
  IsUrl,
  IsArray,
  ArrayMaxSize,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { BlogStatus } from '@prisma/client';

export class UpdateBlogDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Excerpt must be a string' })
  @MinLength(10, { message: 'Excerpt must be at least 10 characters long' })
  excerpt?: string;

  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MinLength(20, { message: 'Content must be at least 20 characters long' })
  content?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'Cover image URL must be a valid URL with protocol (http/https)' }
  )
  coverImageUrl?: string;

  @IsOptional()
  @IsArray({ message: 'Additional images must be an array' })
  @IsUrl(
    { require_protocol: true },
    {
      each: true,
      message: 'Each additional image must be a valid URL with protocol (http/https)',
    }
  )
  @ArrayMaxSize(6, {
    message: 'Additional images must not exceed 6 items to prevent payload abuse',
  })
  additionalImages?: string[];

  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  slug?: string;

  @IsOptional()
  @IsEnum(BlogStatus, { message: 'Status must be either PUBLISHED or UNPUBLISHED' })
  status?: BlogStatus;
}
