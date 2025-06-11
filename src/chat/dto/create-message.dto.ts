import { IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  chat?: string;

  @IsString()
  sender?: string;

  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
