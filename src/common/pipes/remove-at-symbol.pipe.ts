import { PipeTransform, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RemoveAtSymbolPipe implements PipeTransform {
  private readonly logger = new Logger(RemoveAtSymbolPipe.name);

  transform(value: any): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    return this.sanitize(value);
  }

  private sanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([key, val]) => [key, this.sanitize(val)]));
    }

    if (typeof obj === 'string' && obj.startsWith('@')) {
      const sanitized = obj.replace(/^@+/, '');
      this.logger.debug(`Removed @ symbol: "${obj}" → "${sanitized}"`);
      return sanitized;
    }

    return obj;
  }
}
