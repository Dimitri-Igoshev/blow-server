import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class FileSizeGuard implements CanActivate {
  constructor(private readonly maxTotalSize: number) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const files: Express.Multer.File[] = request.files;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    return totalSize <= this.maxTotalSize;
  }
}
