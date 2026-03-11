import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as admin from 'firebase-admin';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { types } from 'pg';

import { AppModule } from './app.module';
import { AuthStrategies } from './common/enums/auth-strategies';
import { GlobalExceptionFilter } from './common/exception-filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.setGlobalPrefix('api');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost), app.get(Logger)));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  if (configService.getOrThrow<string>('API_DOCS_ENABLED') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Administrative management API documentation')
      .setDescription('Development API documentation for administrative management')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access Token',
        },
        AuthStrategies.userJwtAccess,
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Refresh Token',
        },
        AuthStrategies.userJwtRefresh,
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(configService.getOrThrow<number>('PORT'));
  // Transform Postgres numeric type to JS number instead string

  types.setTypeParser(types.builtins.NUMERIC, (value: string): number => parseFloat(value));
  // Write warning stack into console
  process.on('warning', (e) => console.warn('WARNING: ', e.stack));

  app.enableShutdownHooks();
}
void bootstrap();
