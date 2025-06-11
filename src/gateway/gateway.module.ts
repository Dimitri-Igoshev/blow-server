import { Module } from '@nestjs/common';
import { Gateway } from './gateway';

@Module({})
export class GatewayModule {
  providers: [Gateway]
}
