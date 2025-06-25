import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Ip,
  Req,
  HostParam,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RealIP } from 'nestjs-real-ip';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Get('get-ip')
  // get(@RealIP() ip: string, @Req() req: any): string {
  //   console.log(req);
  //   return ip;
  // }

  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('registration')
  register(@Body() data: LoginDto) {
    return this.authService.registration(data);
  }

  @Post('confirmation')
  confirmation(@Body() data: { token: string }) {
    return this.authService.confirmation(data.token);
  }

  @Post('recovery-password')
  recovery(@Body() data: { email: string }) {
    return this.authService.recoveryPassword(data.email);
  }

  @Post('reset-password')
  reset(@Body() data: { password: string; token: string }) {
    return this.authService.resetPassword(data.password, data.token);
  }
}
