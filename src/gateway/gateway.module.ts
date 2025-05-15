import { Module } from '@nestjs/common';
import type { Gateway } from './gateway';

@Module({})
export class GatewayModule {
  providers: [Gateway]
}
