import { BadRequestException, ValidationPipe } from '@nestjs/common';

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints ?? {}).join('. ') + '.',
        }));
        return new BadRequestException({ errors: messages });
      },
    });
  }
}
