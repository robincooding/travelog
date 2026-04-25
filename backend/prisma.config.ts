import * as dotenv from "dotenv";
import * as path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  adapter: () => new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});
