import { IPhoto } from 'src/common/interface/photo.interface';

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
  photos?: IPhoto[];
  sponsor?: boolean;
  traveling?: boolean;
  relationships?: boolean;
  evening?: boolean;
  about?: string;
  voice?: string;
  premium?: boolean;
  phone?: string;
  role?: string;
  status?: string;
  company?: string;
  confirmToken?: string;
  updatedAt?: any;
  blockList?: string[];
  isFake?: boolean;
  referers?: any[];
  contacts?: any;
  purchasedContacts?: any[];
}
