import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, BadRequestError, UnauthorizedError } from './app-error';

describe('AppError', () => {
  it('should create an error with default values', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create an error with custom status code', () => {
    const error = new AppError('Forbidden', 403);
    expect(error.statusCode).toBe(403);
    expect(error.isOperational).toBe(true);
  });

  it('should create a non-operational error', () => {
    const error = new AppError('Critical failure', 500, false);
    expect(error.isOperational).toBe(false);
  });
});

describe('NotFoundError', () => {
  it('should create a 404 error with resource name', () => {
    const error = new NotFoundError('Patient');
    expect(error.message).toBe('Patient not found');
    expect(error.statusCode).toBe(404);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should use default resource name', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Resource not found');
  });
});

describe('BadRequestError', () => {
  it('should create a 400 error with custom message', () => {
    const error = new BadRequestError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should use default message', () => {
    const error = new BadRequestError();
    expect(error.message).toBe('Bad request');
  });
});

describe('UnauthorizedError', () => {
  it('should create a 401 error with custom message', () => {
    const error = new UnauthorizedError('Token expired');
    expect(error.message).toBe('Token expired');
    expect(error.statusCode).toBe(401);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should use default message', () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe('Unauthorized');
  });
});
