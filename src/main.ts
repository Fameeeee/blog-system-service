import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true, // จำเป็นต้องเปิด ถ้าจะใช้ HttpOnly Cookie สำหรับ Admin Login
  });

  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
