import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors';
import { env } from '../../config';

export function errorHandler(
  error: FastifyError | AppError,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  console.error(`[ERROR] ${error.message}`, env.NODE_ENV === 'development' ? error.stack : '');

  // Handle known operational errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
  }

  // Handle unknown errors
  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
}
