import { vi } from 'vitest';

/**
 * Creates a mock model with all common Prisma methods stubbed.
 */
function mockModel() {
  return {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  };
}

/**
 * Creates a mock Prisma client with all model methods stubbed.
 * Import this and use vi.mock() to replace the real prisma import.
 */
export const mockPrismaClient = {
  patient: mockModel(),
  clinic: mockModel(),
  user: mockModel(),
  appointmentType: mockModel(),
  treatment: mockModel(),
  consultation: mockModel(),
  appointment: mockModel(),
  auditLog: mockModel(),
  systemConfig: mockModel(),
  $disconnect: vi.fn(),
};
