export class LoginDto {
  email: string;
  password: string;
  sex?: string;
  city?: string;
  age?: number;
  height?: number;
  weight?: number;
  sponsor?: boolean;
  photos?: any[];
  status?: string;
  fromLanding?: boolean;
}
