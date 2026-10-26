import { randomUUID } from 'crypto';

export const v4 = (): string => randomUUID();
export const validate = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
