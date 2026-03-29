import { vi } from 'vitest';

/**
 * Creates a mock Prisma client with all Patient model methods stubbed.
 * Import this and use vi.mock() to replace the real prisma import.
 */
export const mockPrismaClient = {
  patient: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirstOrThrow: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $disconnect: vi.fn(),
};
