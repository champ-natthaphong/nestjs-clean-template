import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const METHOD_COLOR: Record<string, chalk.Chalk> = {
  GET: chalk.green,
  POST: chalk.yellow,
  PATCH: chalk.blue,
  PUT: chalk.cyan,
  DELETE: chalk.red,
};

function colorDuration(ms: number): string {
  const text = `${ms}ms`;
  if (ms > 500) return chalk.red(text);
  if (ms > 200) return chalk.yellow(text);
  return chalk.green(text);
}

function colorStatus(resultCode?: string): string {
  if (!resultCode) return chalk.gray('-');
  if (resultCode.startsWith('2')) return chalk.green(resultCode);
  if (resultCode.startsWith('4')) return chalk.yellow(resultCode);
  return chalk.red(resultCode);
}

@Injectable()
export class CustomRestInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) ?? uuidv4().split('-')[0];
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    (request as any).requestId = requestId;

    const sanitizedBody = { ...request.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';

    const tag = (METHOD_COLOR[method] ?? chalk.bgWhite.black)(` ${method.padEnd(6)}`);
    const rid = chalk.gray(`[${requestId}]`);
    const path = chalk.white(url);

    // ── REQUEST ──
    this.logger.log(
      `${tag} ${rid} --> ${path}\n` +
        (Object.keys(sanitizedBody).length
          ? `         ${chalk.gray('body')}  ${chalk.cyan(JSON.stringify(sanitizedBody))}\n`
          : '') +
        (Object.keys(request.query).length
          ? `         ${chalk.gray('query')} ${chalk.cyan(JSON.stringify(request.query))}`
          : ''),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${tag} ${rid} <-- ${path} ${colorStatus(data?.resultCode)} ${colorDuration(duration)}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${tag} ${rid} <-- ${path}\n` +
              `         ${chalk.gray('error')}  ${chalk.red(error?.message)}  ${chalk.gray('duration')} ${colorDuration(duration)}`,
          );
        },
      }),
    );
  }
}
