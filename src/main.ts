import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { RequestMethod, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validateEnv } from './common/utils/env-check';

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:', 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: [
            "'self'",
            ...(configService.get('SWAGGER_ENABLED', 'false') === 'true'
              ? ["'unsafe-inline'"]
              : []),
          ],
        },
      },
    }),
  );
  app.enableCors({
    credentials: true,
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 200,
  });
  app.use(compression({ encodings: ['gzip', 'deflate'] }));
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
    defaultVersion: ['1', VERSION_NEUTRAL],
  });
  if (configService.get('SWAGGER_ENABLED', 'false') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('API')
      .setDescription('Production-grade REST API')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'apiKey', in: 'header' }, 'apiKey')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    document.security = [{ apiKey: [] }];
    SwaggerModule.setup('/docs', app, document);
  }
  app.enableShutdownHooks();

  await app.listen(configService.getOrThrow('PORT'));
}
void bootstrap();
