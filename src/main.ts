import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      if (!origin || origin.replace(/\/$/, '') === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(helmet());

  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
