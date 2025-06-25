export interface IPhoto {
  _id?: string;
  url?: string;
  priority?: number;
  main?: boolean;
  name?: string;
  file?: File | null;
}
