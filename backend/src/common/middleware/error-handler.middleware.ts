import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../logger';

export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  // Handle body-parser malformed JSON SyntaxError
  if (
    (err instanceof SyntaxError && 'body' in err) ||
    (typeof err === 'object' &&
      err !== null &&
      'type' in err &&
      (err as { type: unknown }).type === 'entity.parse.failed')
  ) {
    logger.warn('Handled malformed JSON request body [EMPTY_SELECTION]');
    res.status(400).json({
      error: 'EMPTY_SELECTION',
      testIds: [],
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn(`Handled error [${err.code}]: ${err.message}`);
    res.status(err.statusCode).json({
      error: err.code,
      testIds: err.testIds ?? [],
    });
    return;
  }

  logger.error('Unhandled internal server error:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred',
  });
};
