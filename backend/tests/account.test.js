/**
 * 계정 설정 — displayName 변경 / 비밀번호 변경 / 탈퇴.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser, loginAs } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });
const prisma = require("../src/lib/prisma");

describe("PATCH /api/auth/me — 표시 이름 변경", () => {
  let cookies;
  beforeEach(async () => {
    const u = await createUser(app, { email: "u@test.local", displayName: "옛이름" });
    cookies = u.cookies;
  });

  it("정상 변경 → 200, 응답에 갱신된 이름", async () => {
    const res = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", cookies)
      .send({ displayName: "새이름" });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe("새이름");
  });

  it("빈 문자열 → 400", async () => {
    const res = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", cookies)
      .send({ displayName: "   " });
    expect(res.status).toBe(400);
  });

  it("40자 초과 → 400", async () => {
    const res = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", cookies)
      .send({ displayName: "x".repeat(41) });
    expect(res.status).toBe(400);
  });

  it("비로그인 → 401", async () => {
    const res = await request(app).patch("/api/auth/me").send({ displayName: "x" });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/auth/password — 비밀번호 변경", () => {
  let cookies, email;
  beforeEach(async () => {
    const u = await createUser(app, { email: "pw@test.local", password: "currentPW123" });
    cookies = u.cookies;
    email = u.user.email;
  });

  it("현재 비번 정확 + 새 비번 → 200 + 실제 변경", async () => {
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookies)
      .send({ currentPassword: "currentPW123", newPassword: "newPW45678" });
    expect(res.status).toBe(200);

    // 옛 비번 로그인 시도 → 401
    const oldLogin = await loginAs(app, email, "currentPW123");
    expect(oldLogin.response.status).toBe(401);

    // 새 비번 로그인 → 200
    const newLogin = await loginAs(app, email, "newPW45678");
    expect(newLogin.response.status).toBe(200);
  });

  it("현재 비번 틀림 → 401 (변경 안 됨)", async () => {
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookies)
      .send({ currentPassword: "WRONG", newPassword: "newPW45678" });
    expect(res.status).toBe(401);

    // 옛 비번이 여전히 동작 (안 바뀌었음)
    const login = await loginAs(app, email, "currentPW123");
    expect(login.response.status).toBe(200);
  });

  it("새 비번 짧음 (<8) → 400", async () => {
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookies)
      .send({ currentPassword: "currentPW123", newPassword: "short" });
    expect(res.status).toBe(400);
  });

  it("비밀번호 변경 시 미사용 reset 토큰 모두 무효화", async () => {
    // 1) 비번 찾기 요청 → 토큰 발급
    await request(app).post("/api/auth/forgot-password").send({ email });
    const tokensBefore = await prisma.passwordResetToken.findMany({
      where: { usedAt: null },
    });
    expect(tokensBefore.length).toBe(1);

    // 2) 정상 비번 변경
    await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookies)
      .send({ currentPassword: "currentPW123", newPassword: "newPW45678" });

    // 3) 모든 reset 토큰이 usedAt 채워짐
    const tokensAfter = await prisma.passwordResetToken.findMany({
      where: { usedAt: null },
    });
    expect(tokensAfter.length).toBe(0);
  });
});

describe("DELETE /api/auth/me — 회원 탈퇴", () => {
  let cookies, userId, email;
  beforeEach(async () => {
    const u = await createUser(app, { email: "bye@test.local", password: "byePW1234" });
    cookies = u.cookies;
    userId = u.user.id;
    email = u.user.email;
  });

  it("비번 정확 → 200, 사용자 + cascade 모두 삭제", async () => {
    // 1) 탈퇴 전 컬렉션 + 장소 만들기 (cascade 검증용)
    const cRes = await request(app)
      .post("/api/collections")
      .set("Cookie", cookies)
      .send({ title: "탈퇴 전", theme: "테스트" });
    const collectionId = cRes.body.id;

    await request(app)
      .post("/api/places")
      .set("Cookie", cookies)
      .send({
        collectionId,
        name: "장소",
        lat: 37.5,
        lng: 127,
        visitedAt: "2026-01-01",
      });

    // 2) 탈퇴 실행
    const res = await request(app)
      .delete("/api/auth/me")
      .set("Cookie", cookies)
      .send({ password: "byePW1234" });
    expect(res.status).toBe(200);

    // 3) DB 검증 — User, Collection, Place 전부 cascade 삭제
    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.collection.findUnique({ where: { id: collectionId } })).toBeNull();
    const places = await prisma.place.findMany({ where: { collectionId } });
    expect(places).toHaveLength(0);

    // 4) 옛 쿠키로 /me 호출 → 401 (DB 에 사용자 없음)
    const me = await request(app).get("/api/auth/me").set("Cookie", cookies);
    expect(me.status).toBe(401);
  });

  it("비번 틀림 → 401 (탈퇴 안 됨)", async () => {
    const res = await request(app)
      .delete("/api/auth/me")
      .set("Cookie", cookies)
      .send({ password: "WRONG" });
    expect(res.status).toBe(401);

    // 사용자 여전히 존재
    expect(await prisma.user.findUnique({ where: { id: userId } })).not.toBeNull();
  });
});
