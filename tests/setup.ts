/**
 * Global test setup.
 * Sets environment variables BEFORE any app code imports them.
 */
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_schema';
process.env.DATABASE_URL = 'mysql://test_user:test_password@localhost:3306/test_schema';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long!!';
process.env.JWT_EXPIRES_IN = '1h';
