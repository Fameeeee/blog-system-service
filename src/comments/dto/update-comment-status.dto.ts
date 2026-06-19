import { IsEnum, IsNotEmpty } from 'class-validator';
import { CommentStatus } from '@prisma/client';

export class UpdateCommentStatusDto {
  @IsEnum(CommentStatus, {
    message: 'Status must be either APPROVED or REJECTED',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: 'APPROVED' | 'REJECTED';
}
