import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, NotFoundError } from '../errors';
import { FastifyReply, FastifyRequest } from 'fastify';

describe('errorHandler', () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let sendMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    sendMock = vi.fn().mockReturnThis();
    statusMock = vi.fn().mockReturnValue({ send: sendMock });

    mockRequest = {} as FastifyRequest;
    mockReply = { status: statusMock, send: sendMock } as unknown as FastifyReply;

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  async function getHandler(nodeEnv: string) {
    vi.doMock('../../config', () => ({
      env: { NODE_ENV: nodeEnv },
    }));
    const mod = await import('./error-handler');
    return mod.errorHandler;
  }

  it('should handle AppError with correct status code and message', async () => {
    const handler = await getHandler('development');
    const error = new AppError('Something failed', 422);

    handler(error, mockRequest, mockReply);

    expect(statusMock).toHaveBeenCalledWith(422);
    expect(sendMock).toHaveBeenCalledWith({
      success: false,
      error: 'Something failed',
    });
  });

  it('should handle NotFoundError as an AppError subclass', async () => {
    const handler = await getHandler('development');
    const error = new NotFoundError('Patient');

    handler(error, mockRequest, mockReply);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(sendMock).toHaveBeenCalledWith({
      success: false,
      error: 'Patient not found',
    });
  });

  it('should handle Fastify validation errors', async () => {
    const handler = await getHandler('development');
    const error = {
      message: 'Validation failed',
      validation: [{ keyword: 'required', params: { missingProperty: 'name' } }],
    } as any;

    handler(error, mockRequest, mockReply);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(sendMock).toHaveBeenCalledWith({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
  });

  it('should handle unknown errors with their status code', async () => {
    const handler = await getHandler('development');
    const error = { message: 'Gateway timeout', statusCode: 504 } as any;

    handler(error, mockRequest, mockReply);

    expect(statusMock).toHaveBeenCalledWith(504);
  });

  it('should default to 500 for unknown errors without statusCode', async () => {
    const handler = await getHandler('development');
    const error = { message: 'Something broke' } as any;

    handler(error, mockRequest, mockReply);

    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('should expose error message in development', async () => {
    const handler = await getHandler('development');
    const error = { message: 'Detailed internal error' } as any;

    handler(error, mockRequest, mockReply);

    expect(sendMock).toHaveBeenCalledWith({
      success: false,
      error: 'Detailed internal error',
    });
  });

  it('should hide error message in production', async () => {
    const handler = await getHandler('production');
    const error = { message: 'Detailed internal error' } as any;

    handler(error, mockRequest, mockReply);

    expect(sendMock).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });
});
