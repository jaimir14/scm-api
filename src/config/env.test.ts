import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env config', () => {
  const VALID_ENV = {
    PORT: '3000',
    NODE_ENV: 'development',
    DB_HOST: 'localhost',
    DB_PORT: '3306',
    DB_USER: 'root',
    DB_PASSWORD: 'secret',
    DB_NAME: 'test_db',
    JWT_SECRET: 'a-secret-key-that-is-at-least-32-characters-long',
    JWT_EXPIRES_IN: '2h',
  };

  // We need to test env.ts in isolation, so we re-import it each time
  // after setting process.env
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    Object.keys(VALID_ENV).forEach((key) => {
      delete process.env[key];
    });
  });

  it('should parse valid environment variables', async () => {
    Object.assign(process.env, VALID_ENV);
    const { env } = await import('./env');

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(3306);
    expect(env.DB_USER).toBe('root');
    expect(env.DB_PASSWORD).toBe('secret');
    expect(env.DB_NAME).toBe('test_db');
    expect(env.JWT_SECRET).toBe('a-secret-key-that-is-at-least-32-characters-long');
    expect(env.JWT_EXPIRES_IN).toBe('2h');
  });

  it('should build DATABASE_URL from individual vars', async () => {
    Object.assign(process.env, VALID_ENV);
    const { env } = await import('./env');

    expect(env.DATABASE_URL).toBe('mysql://root:secret@localhost:3306/test_db');
  });

  it('should set process.env.DATABASE_URL', async () => {
    Object.assign(process.env, VALID_ENV);
    await import('./env');

    expect(process.env.DATABASE_URL).toBe('mysql://root:secret@localhost:3306/test_db');
  });

  it('should use default values for PORT, NODE_ENV, DB_HOST, DB_PORT, JWT_EXPIRES_IN', async () => {
    // Only set required vars
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'test_db';
    process.env.JWT_SECRET = 'a-secret-key-that-is-at-least-32-characters-long';

    const { env } = await import('./env');

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(3306);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
  });

  it('should exit process when required vars are missing', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear all required vars
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.JWT_SECRET;

    await expect(import('./env')).rejects.toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockError.mockRestore();
  });

  it('should reject JWT_SECRET shorter than 32 characters', async () => {
    Object.assign(process.env, { ...VALID_ENV, JWT_SECRET: 'short' });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(import('./env')).rejects.toThrow('process.exit called');

    mockExit.mockRestore();
    mockError.mockRestore();
  });

  it('should reject invalid NODE_ENV values', async () => {
    Object.assign(process.env, { ...VALID_ENV, NODE_ENV: 'staging' });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(import('./env')).rejects.toThrow('process.exit called');

    mockExit.mockRestore();
    mockError.mockRestore();
  });

  it('should coerce PORT and DB_PORT from strings to numbers', async () => {
    Object.assign(process.env, { ...VALID_ENV, PORT: '8080', DB_PORT: '3307' });
    const { env } = await import('./env');

    expect(env.PORT).toBe(8080);
    expect(env.DB_PORT).toBe(3307);
  });
});
