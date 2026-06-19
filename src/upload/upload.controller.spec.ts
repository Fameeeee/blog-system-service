import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('UploadController', () => {
  let controller: UploadController;
  let service: UploadService;

  const mockUploadService = {
    uploadImage: jest.fn(),
  };

  const mockFile: Express.Multer.File = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UploadController>(UploadController);
    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return the image URL', async () => {
      const mockImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      mockUploadService.uploadImage.mockResolvedValue(mockImageUrl);

      const result = await controller.uploadFile(mockFile);

      expect(result).toEqual({
        imageUrl: mockImageUrl,
        message: 'Image uploaded successfully',
      });
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockUploadService.uploadImage).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from upload service', async () => {
      const error = new Error('Upload failed');
      mockUploadService.uploadImage.mockRejectedValue(error);

      await expect(controller.uploadFile(mockFile)).rejects.toThrow('Upload failed');
      expect(mockUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('Security', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', UploadController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
