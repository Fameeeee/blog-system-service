import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload a single image file to cloud storage
   * @secured Only authenticated admins can upload files
   * @param file - The uploaded file (max 5MB, only jpeg/png/webp)
   * @returns Object containing the uploaded image URL
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Enforce maximum file size of 5MB
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024, // 5MB in bytes
            message: 'File size must not exceed 5MB',
          }),
          // Strictly enforce allowed MIME types for security
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png|image\/webp)/,
          }),
        ],
        errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    // Upload the validated file to cloud storage
    const imageUrl = await this.uploadService.uploadImage(file);

    return {
      imageUrl,
      message: 'Image uploaded successfully',
    };
  }
}
