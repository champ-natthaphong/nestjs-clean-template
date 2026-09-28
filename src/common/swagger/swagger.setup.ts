import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  if (process.env.ZONE !== 'local') return;

  const config = new DocumentBuilder()
    .setTitle('NestJS Clean Template')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addServer('http://localhost:31000/api/v1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
};
