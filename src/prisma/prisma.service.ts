import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  pgPool?: Pool;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    let adapter: PrismaPg;
    if (process.env.NODE_ENV === 'production') {
      const pool = new Pool({ connectionString });
      adapter = new PrismaPg(pool);
    } else {
      if (!globalForPrisma.pgPool) {
        globalForPrisma.pgPool = new Pool({ connectionString });
      }
      adapter = new PrismaPg(globalForPrisma.pgPool);
    }

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
