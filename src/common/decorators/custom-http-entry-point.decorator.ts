import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { EntryPointInterceptor } from '../interceptors/entry-point.interceptor';

export const ENTRY_POINT_KEY = 'entryPoint';

export const CustomHttpEntryPoint = (name: string) =>
  applyDecorators(SetMetadata(ENTRY_POINT_KEY, name), UseInterceptors(EntryPointInterceptor));
