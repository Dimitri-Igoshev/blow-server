import { PartialType } from '@nestjs/mapped-types';

export class UpdateServiceDto {
  name?: string;
  type?: string;
  services?: string[];
  options?: any[];
  description?: string;
  order?: number;
  btn?: string;
}
