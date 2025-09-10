import { IsString } from 'class-validator';
export class ExchangeTokenDto {
  @IsString() code!: string;
  @IsString() state?: string;
}