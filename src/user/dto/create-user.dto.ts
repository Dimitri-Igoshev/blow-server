import { IPhoto } from "src/common/interface/photo.interface";

export class CreateUserDto {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  city?: string;
  age?: number;
  height?: number;
  weight?: number;
  sponsor?: string;
  photos?: IPhoto[];
  phone?: string;
  role?: string;
  status?: string;
  company?: string;
  // refreshToken?: string;
  // resetToken?: string;
  confirmToken?: string;
}
