import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { types } from 'pg';

import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { AuthStrategies } from './common/enums/auth-strategies';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);

  app.use(cookieParser());

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
      .addCookieAuth(AuthStrategies.userJwtAccess)
      .addCookieAuth(AuthStrategies.userJwtRefresh)
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(configService.getOrThrow<number>('PORT'));
  // Transform Postgres numeric type to JS number instead string

  types.setTypeParser(types.builtins.NUMERIC, (value: string): number => parseFloat(value));
  // Write warning stack into console
  process.on('warning', (e) => console.warn('WARNING: ', e.stack));
}
void bootstrap();
