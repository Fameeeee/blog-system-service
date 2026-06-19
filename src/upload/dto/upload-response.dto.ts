import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

/**
 * DTO for upload response
 */
export class UploadResponseDto {
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @IsNotEmpty()
  imageUrl!: string;

  @IsString()
  message?: string;
}
