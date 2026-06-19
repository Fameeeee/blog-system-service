import {
  IsString,
  IsUrl,
  IsArray,
  ArrayMaxSize,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateBlogDto {
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  declare title: string;

  @IsString({ message: 'Excerpt must be a string' })
  @MinLength(10, { message: 'Excerpt must be at least 10 characters long' })
  declare excerpt: string;

  @IsString({ message: 'Content must be a string' })
  @MinLength(20, { message: 'Content must be at least 20 characters long' })
  declare content: string;

  @IsUrl(
    { require_protocol: true },
    { message: 'Cover image URL must be a valid URL with protocol (http/https)' }
  )
  declare coverImageUrl: string;

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
  @IsOptional()
  additionalImages?: string[];

  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  slug?: string;
}
