import { Injectable, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse, v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { Multer } from 'multer';

@Injectable()
export class UploadService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: typeof cloudinary) {}
  /**
   * Upload an image file to Cloudinary using streamifier
   * @param file - The validated Express.Multer.File object
   * @returns The secure HTTPS URL of the uploaded image
   * @throws BadRequestException if file is invalid
   * @throws InternalServerErrorException if upload fails
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file provided');
    }

    return new Promise<string>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: 'blog-images',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [
            {
              quality: 'auto:good',
              fetch_format: 'auto',
            },
          ],
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          overwrite: false,
          invalidate: true,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(
              new InternalServerErrorException(
                'Failed to upload image to cloud storage. Please try again.',
              ),
            );
          }
          resolve(result.secure_url);
        },
      );

      // Convert Multer buffer to stream and pipe to Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId - The Cloudinary public_id of the image
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await this.cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new InternalServerErrorException('Failed to delete image from cloud storage');
    }
  }
}
