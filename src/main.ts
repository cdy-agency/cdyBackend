import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'https://cdyagency.com'],
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const config = new DocumentBuilder()
    .setTitle('CDY Agency API')
    .setDescription(
      'API for news, content creators, and social follower sync (Phase 1)',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`App is running on: http://localhost:${port}`);
  console.log(`Swagger is available on: http://localhost:${port}/api`);
}
bootstrap();
