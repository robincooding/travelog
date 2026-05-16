import * as dotenv from "dotenv";
import * as path from "node:path";
import { defineConfig } from "prisma/config";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  // PostgreSQL 은 Prisma 의 기본 드라이버 사용 — 별도 adapter 불필요
});
