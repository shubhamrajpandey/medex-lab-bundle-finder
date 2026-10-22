export const PlanErrorCode = {
  EMPTY_SELECTION: 'EMPTY_SELECTION',
  INVALID_TESTS: 'INVALID_TESTS',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type PlanErrorCode = (typeof PlanErrorCode)[keyof typeof PlanErrorCode];

export const HttpErrorCode = {
  ...PlanErrorCode,
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
  
export type HttpErrorCode = (typeof HttpErrorCode)[keyof typeof HttpErrorCode];
