import { applyDecorators } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { SetMetadata } from '@nestjs/common';

export const ENTRY_POINT_TOPIC_KEY = 'entryPointTopic';

export const EntryPoint = (topic: string) =>
  applyDecorators(SetMetadata(ENTRY_POINT_TOPIC_KEY, topic), MessagePattern(topic));
