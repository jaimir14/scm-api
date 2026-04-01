import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Build DATABASE_URL from individual env vars (same logic as load-env.ts)
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Missing required DB_USER, DB_PASSWORD, or DB_NAME in .env');
  process.exit(1);
}
const host = DB_HOST || 'localhost';
const port = DB_PORT || '3306';
process.env.DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${host}:${port}/${DB_NAME}`;

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { usuario: 'jmiranda' },
    update: {},
    create: {
      usuario: 'jmiranda',
      nombre: 'Dr. Miranda',
      password: hashedPassword,
      rol: Rol.ADMINISTRADOR,
      estado: true,
    },
  });

  console.log(`Seed complete — admin user created: ${user.usuario} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
