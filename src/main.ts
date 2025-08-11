import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

const whitelist = new Set(['https://blow.ru', 'http://localhost:3000']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.set('trust proxy', true); // теперь TypeScript не ругается

  app.enableCors({
    origin: (origin, cb) => {
      // Разрешаем запросы без Origin (например, curl, SSR) и из whitelist
      if (!origin || whitelist.has(origin)) return cb(null, true);
      // НЕ бросаем ошибку (иначе 500), просто отклоняем
      return cb(null, false);
    },
    credentials: true, // если шлёшь куки/авторизацию
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
