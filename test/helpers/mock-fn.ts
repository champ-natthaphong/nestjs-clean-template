import { jest } from '@jest/globals';

export const asyncMock = () => jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const syncMock = () => jest.fn<(...args: unknown[]) => unknown>();
