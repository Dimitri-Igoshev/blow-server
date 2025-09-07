import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class EditMessageDto {
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsBoolean()
  isReaded?: boolean;

  @IsOptional()
  replyTo?: string | null;

  @IsOptional()
  type?: string;

  @IsOptional()
  unreadBy?: string[];
}
