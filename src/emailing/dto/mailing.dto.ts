// dto/mailing.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsUrl,
} from 'class-validator';
import { UserSex, UserStatus } from '../../user/entities/user.entity';

export class BulkMailDto {
  @IsString()
  subject: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus; // NEW|ACTIVE|INACTIVE|ARCHIVE|ALL

  @IsOptional()
  @IsEnum(UserSex)
  sex?: UserSex; // MALE|FEMALE

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsUrl()
  ctaLink?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;
}

export class BonusMailDto {
  @IsString()
  subject: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserSex)
  sex?: UserSex;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsInt()
  amount?: number; // default 500 в сервисе

  @IsOptional()
  @IsUrl()
  ctaLink?: string;

  @IsOptional()
  @IsString()
  ctaText?: string;
}
