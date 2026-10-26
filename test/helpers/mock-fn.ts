import { jest } from '@jest/globals';

export const asyncMock = () => jest.fn<(...args: unknown[]) => Promise<unknown>>();
