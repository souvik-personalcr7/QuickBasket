import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';
import { env } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: unknown = undefined;

  // Handle known AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } 
  // Handle Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  }
  // Handle Mongoose Duplicate Key Error (E11000)
  else if ('code' in err && (err as { code: number }).code === 11000) {
    statusCode = 409;
    const errObj = err as { keyValue?: Record<string, unknown>; message?: string };
    const keyValue = errObj.keyValue;
    const rawMsg = errObj.message || '';

    if ((keyValue && 'email' in keyValue) || rawMsg.includes('email_1') || rawMsg.includes('email:')) {
      message = 'This email address is already registered. Please use another email.';
    } else if ((keyValue && 'phone' in keyValue) || rawMsg.includes('phone_1') || rawMsg.includes('phone:')) {
      message = 'This phone number is already registered. Please use another phone number.';
    } else {
      const field = keyValue ? Object.keys(keyValue)[0] : 'field';
      message = `Duplicate value for ${field}. Please use another value.`;
    }
  }
  // Handle JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Log unexpected errors
  if (statusCode === 500) {
    console.error('💥 UNHANDLED SERVER ERROR:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
