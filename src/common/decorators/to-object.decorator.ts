import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

const logger = new Logger('ToObjectDecorator');

export const ToObjectDecorator = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const rpcContext = ctx.switchToRpc();
  const raw = rpcContext.getData();

  // Already an object
  if (raw && typeof raw === 'object' && !Buffer.isBuffer(raw)) {
    return raw;
  }

  // Parse string/buffer
  try {
    const str = Buffer.isBuffer(raw) ? raw.toString('utf-8') : String(raw);
    return JSON.parse(str);
  } catch (error) {
    const err = error as Error;
    logger.error(`Failed to parse Kafka message: ${err.message}`);
    return raw;
  }
});
