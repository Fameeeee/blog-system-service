import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCommentDto {
  // blogId is injected from URL parameter in controller, not from request body
  blogId: string;

  @IsString()
  @IsNotEmpty({ message: 'Sender name is required' })
  @MaxLength(100, { message: 'Sender name must not exceed 100 characters' })
  senderName: string;

  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, {
    message: 'Content must not exceed 1000 characters',
  })
  @Matches(/^[ก-๙๐-๙0-9\s\r\n.,!?()''""]+$/, {
    message:
      'ข้อความต้องเป็นภาษาไทย ตัวเลข หรือเครื่องหมายวรรคตอนพื้นฐานเท่านั้น',
  })
  content: string;
}
