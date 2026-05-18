import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser, loginAs } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });

// ── 회원가입 ──────────────────────────────────
describe("POST /api/auth/register", () => {
  it("성공 시 201 + 사용자 정보 + httpOnly 쿠키 발급", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "alice@test.local",
      password: "hello12345",
      displayName: "앨리스",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: "alice@test.local",
      displayName: "앨리스",
    });
    // passwordHash 가 응답에 절대 노출되면 안 됨
    expect(res.body.user.passwordHash).toBeUndefined();

    // Set-Cookie 헤더 + httpOnly 플래그
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes("loci_token=") && c.includes("HttpOnly"))).toBe(true);
  });

  it("잘못된 이메일 형식 → 400 + Zod issues", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "hello12345",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/이메일/);
    expect(res.body.issues[0].path).toBe("email");
  });

  it("짧은 비밀번호 (<8) → 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "bob@test.local",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8자/);
  });

  it("이미 가입된 이메일 → 409", async () => {
    await createUser(app, { email: "dup@test.local" });
    const res = await request(app).post("/api/auth/register").send({
      email: "dup@test.local",
      password: "hello12345",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/이미/);
  });
});

// ── 로그인 ────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("올바른 자격증명 → 200 + 사용자 + 쿠키", async () => {
    await createUser(app, { email: "carol@test.local", password: "hello12345" });

    const res = await request(app).post("/api/auth/login").send({
      email: "carol@test.local",
      password: "hello12345",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("carol@test.local");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("잘못된 비밀번호 → 401 (통일된 메시지)", async () => {
    await createUser(app, { email: "dan@test.local", password: "correct1234" });

    const res = await request(app).post("/api/auth/login").send({
      email: "dan@test.local",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/이메일 또는 비밀번호/);
  });

  it("존재하지 않는 이메일 → 401 (같은 메시지 — enumeration 방어)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@nope.local",
      password: "anything12345",
    });

    expect(res.status).toBe(401);
    // 위 "잘못된 비밀번호" 와 정확히 같은 메시지여야 함
    expect(res.body.error).toMatch(/이메일 또는 비밀번호/);
  });
});

// ── 현재 사용자 조회 ───────────────────────────
describe("GET /api/auth/me", () => {
  it("쿠키 있으면 200 + 사용자", async () => {
    const { cookies } = await createUser(app, { email: "eve@test.local" });

    const res = await request(app).get("/api/auth/me").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("eve@test.local");
  });

  it("쿠키 없으면 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("위조 토큰 (잘못된 시그니처) → 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "loci_token=eyJhbGciOiJIUzI1NiJ9.invalid.signature");
    expect(res.status).toBe(401);
  });
});

// ── 로그아웃 ──────────────────────────────────
describe("POST /api/auth/logout", () => {
  it("쿠키 제거 후 /me → 401", async () => {
    const { cookies } = await createUser(app, { email: "frank@test.local" });

    // 로그인 상태 확인
    const meRes1 = await request(app).get("/api/auth/me").set("Cookie", cookies);
    expect(meRes1.status).toBe(200);

    // 로그아웃 — 응답 set-cookie 가 Max-Age=0 또는 빈 값
    const logoutRes = await request(app).post("/api/auth/logout").set("Cookie", cookies);
    expect(logoutRes.status).toBe(200);

    const clearedCookies = logoutRes.headers["set-cookie"];
    expect(clearedCookies.some((c) => c.includes("loci_token=;") || c.includes("Max-Age=0"))).toBe(true);

    // 클리어된 쿠키로 /me 호출 → 401
    const meRes2 = await request(app).get("/api/auth/me").set("Cookie", clearedCookies);
    expect(meRes2.status).toBe(401);
  });
});
