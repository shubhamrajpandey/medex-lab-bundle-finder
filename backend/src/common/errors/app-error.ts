import type { HttpErrorCode } from './error-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: HttpErrorCode;
  public readonly testIds?: string[];

  constructor(message: string, statusCode: number, code: HttpErrorCode, testIds?: string[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.testIds = testIds;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
