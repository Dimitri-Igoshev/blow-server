import { IsString, IsOptional } from 'class-validator';

export class EditMessageDto {
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
