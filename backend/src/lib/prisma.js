const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

/**
 * Prisma 7 부터 PrismaClient 는 driver adapter (또는 Accelerate) 가 필수.
 * - PostgreSQL: @prisma/adapter-pg (pg 드라이버 래퍼)
 * - 마이그레이션 / generate 도구는 prisma.config.ts 의 datasource.url 을 사용
 */
// 단일 instance 보장 — 테스트 환경 (vitest) 에서 setupFiles 가 매 file 마다
// 재평가되면서 module cache 무력화 → 여러 instance 가 만들어지면 connection pool 이
// 분리되어 race condition. globalThis 에 stash 하면 같은 process 내에서는
// 첫 호출의 instance 를 재사용 (운영 환경에선 어차피 한 번만 평가됨 — 무해).
const prisma =
  globalThis.__lociPrisma ??
  (globalThis.__lociPrisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  }));

module.exports = prisma;
