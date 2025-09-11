import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.setGlobalPrefix('api');

  app.set('trust proxy', true); // теперь TypeScript не ругается

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
