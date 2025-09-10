import { IsInt, IsOptional, IsString, Min } from 'class-validator';
export class DepositDto {
  @IsString() userId!: string;
  @IsInt() @Min(1) amountMinor!: number;      // копейки
  @IsString() @IsOptional() comment?: string;  // комментарий отправителю
}