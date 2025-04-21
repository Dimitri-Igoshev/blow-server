import { IPhoto } from "src/common/interface/photo.interface";

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  emil?: string;
  password?: string;
  sex?: string
  city?: string
  age?: number
  height?: number
  weight?: number
  sponsor?: string
  photos?: IPhoto[]
  phone?: string;
  role?: string;
  status?: string;
  company?: string;
  refreshToken?: string;
  resetToken?: string;
  confirmToken?: string;
}
