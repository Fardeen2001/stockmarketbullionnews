import { logger } from './logger';

export function handleApiError(error, context = '') {
  logger.error(`API Error${context ? ` in ${context}` : ''}`, {
    message: error.message,
    stack: error.stack,
  });

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && !error.expose
    ? 'An internal error occurred'
    : error.message;

  return {
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  };
}

export class ApiError extends Error {
  constructor(message, statusCode = 500, expose = false) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.expose = expose;
  }
}
