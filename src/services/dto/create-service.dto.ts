export class CreateServiceDto {
  name: string;
  type: string;
  services?: string[];
  options: any[];
  description?: string;
  order?: number;
  btn?: string;
}
