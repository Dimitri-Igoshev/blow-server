import { IPhoto } from 'src/common/interface/photo.interface';

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  sex?: string;
  city?: string;
  age?: number;
  height?: number;
  weight?: number;
  sponsor?: boolean;
  traveling?: boolean;
  relationships?: boolean;
  evening?: boolean;
  about?: string;
  voice?: string;
  premium?: boolean;
  photos?: IPhoto[];
  phone?: string;
  role?: string;
  status?: string;
  company?: string;
  refreshToken?: string;
  resetToken?: string;
  confirmToken?: string;
  updatedAt?: any;
  activity?: any;
  raisedAt?: any;
  balance?: any;
  lastMailing?: string;
  blockList?: string[];
  isFake?: boolean;
  referers?: any[];
  contacts?: any;
  purchasedContacts?: any[];
}
