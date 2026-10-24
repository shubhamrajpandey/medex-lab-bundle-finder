import { AppError } from '../../common/errors/app-error';
import { PlanErrorCode } from '../../common/errors/error-codes';

export class EmptySelectionError extends AppError {
  constructor(message = 'No tests were selected') {
    super(message, 400, PlanErrorCode.EMPTY_SELECTION, []);
  }
}

export class InvalidTestsError extends AppError {
  constructor(invalidTestIds: string[], message = 'One or more selected tests are unknown or inactive') {
    super(message, 400, PlanErrorCode.INVALID_TESTS, invalidTestIds);
  }
}

export class NotAvailableError extends AppError {
  constructor(unobtainableTestIds: string[], message = 'No plan can cover the selection') {
    super(message, 422, PlanErrorCode.NOT_AVAILABLE, unobtainableTestIds);
  }
}
