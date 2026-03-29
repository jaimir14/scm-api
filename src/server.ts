import { buildApp } from './app';
import { env } from './config';
import { prisma } from './database';

async function main() {
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  });

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 Server running on http://localhost:${env.PORT}`);
    app.log.info(`📋 Environment: ${env.NODE_ENV}`);
    app.log.info(`🗄️  Database schema: ${env.DB_NAME}`);
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
