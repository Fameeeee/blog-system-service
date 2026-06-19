import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import * as streamifier from 'streamifier';

// Mock streamifier
jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

describe('UploadService', () => {
  let service: UploadService;
  let mockCloudinary: any;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024 * 1024, // 1MB
    stream: null,
    destination: '',
    filename: '',
    path: '',
  } as Express.Multer.File;

  beforeEach(async () => {
    mockCloudinary = {
      uploader: {
        upload_stream: jest.fn(),
        destroy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: 'CLOUDINARY',
          useValue: mockCloudinary,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should upload an image successfully and return secure_url', async () => {
      const mockSecureUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
      
      const mockReadStream = { 
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      const mockUploadStream = { 
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      // Mock streamifier
      (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

      // Mock upload_stream to call callback with success
      mockCloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        setTimeout(() => callback(undefined, { secure_url: mockSecureUrl }), 0);
        return mockUploadStream;
      });

      const result = await service.uploadImage(mockFile);

      expect(result).toBe(mockSecureUrl);
      expect(streamifier.createReadStream).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockReadStream.pipe).toHaveBeenCalledWith(mockUploadStream);
    });

    it('should throw BadRequestException if file is null', async () => {
      await expect(service.uploadImage(null)).rejects.toThrow(BadRequestException);
      await expect(service.uploadImage(null)).rejects.toThrow('Invalid file provided');
    });

    it('should throw BadRequestException if file buffer is missing', async () => {
      const fileWithoutBuffer = { ...mockFile, buffer: null };
      await expect(service.uploadImage(fileWithoutBuffer)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on Cloudinary error', async () => {
      const mockReadStream = { 
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      const mockUploadStream = { 
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

      mockCloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        setTimeout(() => callback({ message: 'Cloudinary API error' }, undefined), 0);
        return mockUploadStream;
      });

      await expect(service.uploadImage(mockFile)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      const publicId = 'blog-images/1234567890-test-image';
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await expect(service.deleteImage(publicId)).resolves.not.toThrow();
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
    });

    it('should throw InternalServerErrorException on delete error', async () => {
      const publicId = 'blog-images/1234567890-test-image';
      mockCloudinary.uploader.destroy.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteImage(publicId)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
