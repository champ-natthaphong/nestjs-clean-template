// src/common/utils/response.util.ts
export const ResultCodes = {
  SUCCESS: '20000',
  CREATED: '20100',
  NOT_FOUND: '40400',
  BAD_REQUEST: '40000',
  UNAUTHORIZED: '40100',
  INTERNAL_ERROR: '50000',
} as const;

export type ResultCode = (typeof ResultCodes)[keyof typeof ResultCodes];

export function buildSuccessResponse(data: any, resultCode: ResultCode = ResultCodes.SUCCESS) {
  return {
    resultCode,
    resultDescription: 'Success',
    developerMessage: '',
    data,
  };
}

export function buildErrorResponse(
  resultCode: ResultCode,
  developerMessage: string,
  _status?: number,
) {
  return {
    resultCode,
    resultDescription: 'Error',
    developerMessage,
    data: { message: developerMessage, messageList: [] },
  };
}
