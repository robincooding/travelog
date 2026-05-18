/**
 * 환경 검증용 sanity test.
 * - createApp 이 listen 없이 동작하는가
 * - supertest 가 in-process 로 호출하는가
 * - 테스트 DB 연결이 살아있고 cleanup 이 동작하는가
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const prisma = require("../src/lib/prisma");
const app = createApp({ enableRateLimit: false });

describe("environment sanity", () => {
  it("health endpoint returns 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("uses test database (loci_test)", async () => {
    const result = await prisma.$queryRaw`SELECT current_database() as db`;
    expect(result[0].db).toBe("loci_test");
  });

  it("DB is empty at start of each test (cleanup works)", async () => {
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });
});
