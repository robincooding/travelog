const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

/**
 * Prisma 7 부터 PrismaClient 는 driver adapter (또는 Accelerate) 가 필수.
 * - PostgreSQL: @prisma/adapter-pg (pg 드라이버 래퍼)
 * - 마이그레이션 / generate 도구는 prisma.config.ts 의 datasource.url 을 사용
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
