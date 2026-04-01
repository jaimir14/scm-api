import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    id: 1,
    usuario: 'jdoe',
    nombre: 'John Doe',
    password: '$2a$10$hashedpassword',
    rol: 'ADMINISTRADOR',
    especialidad: null,
    clinicaId: null,
    clinica: null,
    estado: true,
    ultimoAcceso: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new UserService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users without password', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaClient.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('password');
      expect(result.data[0].usuario).toBe('jdoe');
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should calculate correct skip for page 2', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { clinica: true },
      });
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('should return user without password when found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.usuario).toBe('jdoe');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { clinica: true },
      });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('User not found');
    });
  });

  describe('findByUsuario', () => {
    it('should return user with password when found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsuario('jdoe');

      expect(result).toHaveProperty('password');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { usuario: 'jdoe' },
      });
    });

    it('should return null when not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsuario('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with hashed password and return without password', async () => {
      const input = {
        usuario: 'newuser',
        nombre: 'New User',
        password: 'secret123',
        rol: 'MEDICO' as const,
        estado: true,
      };
      mockPrismaClient.user.create.mockResolvedValue({ ...mockUser, ...input, id: 2 });

      const result = await service.create(input);

      expect(result).not.toHaveProperty('password');
      // Verify bcrypt hash was used (password arg should be hashed, not plaintext)
      const createCall = mockPrismaClient.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('secret123');
      expect(createCall.data.password).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('update', () => {
    it('should update and return user without password', async () => {
      const input = { nombre: 'Updated Name' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, ...input });

      const result = await service.update(1, input);

      expect(result).not.toHaveProperty('password');
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
        include: { clinica: true },
      });
    });

    it('should hash password when updating password', async () => {
      const input = { password: 'newpass123' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      await service.update(1, input);

      const updateCall = mockPrismaClient.user.update.mock.calls[0][0];
      expect(updateCall.data.password).not.toBe('newpass123');
      expect(updateCall.data.password).toMatch(/^\$2[aby]\$/);
    });

    it('should throw NotFoundError when updating non-existent user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'Updated' })).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete the user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.delete.mockResolvedValue(mockUser);

      await service.delete(1);

      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('User not found');
    });
  });

  describe('updateLastAccess', () => {
    it('should update ultimoAcceso timestamp', async () => {
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      await service.updateLastAccess(1);

      const call = mockPrismaClient.user.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 1 });
      expect(call.data.ultimoAcceso).toBeInstanceOf(Date);
    });
  });
});
