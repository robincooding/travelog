/**
 * Zod 입력 검증 테스트.
 *
 * 각 라우터의 schema 가 잘못된 입력을 일관된 형식으로 거절하는지 확인.
 * 응답 형식: { error: string, issues: [{ path, message }] }
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });

describe("Zod 입력 검증", () => {
  let cookies, collectionId;

  beforeEach(async () => {
    const user = await createUser(app, { email: "validator@test.local" });
    cookies = user.cookies;
    const c = await request(app)
      .post("/api/collections")
      .set("Cookie", cookies)
      .send({ title: "검증 테스트", theme: "테스트" });
    collectionId = c.body.id;
  });

  // ── Collections ─────────────────────────────
  describe("POST /api/collections", () => {
    it("title 누락 → 400", async () => {
      const res = await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ theme: "카페" });
      expect(res.status).toBe(400);
      expect(res.body.issues[0].path).toBe("title");
    });

    it("theme 누락 → 400", async () => {
      const res = await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "테마 없음" });
      expect(res.status).toBe(400);
      expect(res.body.issues[0].path).toBe("theme");
    });

    it("trim 자동 적용 — 앞뒤 공백 제거", async () => {
      const res = await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "   공백 제거 됨   ", theme: " 카페 " });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("공백 제거 됨");
      expect(res.body.theme).toBe("카페");
    });
  });

  // ── Places ──────────────────────────────────
  describe("POST /api/places", () => {
    const baseBody = (collectionId) => ({
      collectionId,
      name: "테스트 장소",
      lat: 37.5,
      lng: 127,
      visitedAt: "2026-01-01",
    });

    it("lat 범위 초과 (91) → 400", async () => {
      const res = await request(app)
        .post("/api/places")
        .set("Cookie", cookies)
        .send({ ...baseBody(collectionId), lat: 91 });
      expect(res.status).toBe(400);
      expect(res.body.issues[0].path).toBe("lat");
    });

    it("lng 범위 초과 (-181) → 400", async () => {
      const res = await request(app)
        .post("/api/places")
        .set("Cookie", cookies)
        .send({ ...baseBody(collectionId), lng: -181 });
      expect(res.status).toBe(400);
      expect(res.body.issues[0].path).toBe("lng");
    });

    it("coerce 동작 — 문자열 lat/lng 도 number 로 변환", async () => {
      const res = await request(app)
        .post("/api/places")
        .set("Cookie", cookies)
        .send({ ...baseBody(collectionId), lat: "37.5", lng: "127.0" });
      expect(res.status).toBe(201);
      expect(res.body.lat).toBe(37.5);
      expect(res.body.lng).toBe(127);
    });

    it("coerce 동작 — ISO date 문자열 → Date 객체", async () => {
      const res = await request(app)
        .post("/api/places")
        .set("Cookie", cookies)
        .send({ ...baseBody(collectionId), visitedAt: "2025-12-31" });
      expect(res.status).toBe(201);
      expect(new Date(res.body.visitedAt).toISOString()).toMatch(/^2025-12-31/);
    });

    it("name 누락 → 400", async () => {
      const body = baseBody(collectionId);
      delete body.name;
      const res = await request(app)
        .post("/api/places")
        .set("Cookie", cookies)
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.issues[0].path).toBe("name");
    });
  });

  // ── Upload presign ──────────────────────────
  describe("POST /api/upload/presign", () => {
    it("허용 안 된 contentType (video/mp4) → 400", async () => {
      const res = await request(app)
        .post("/api/upload/presign")
        .set("Cookie", cookies)
        .send({ contentType: "video/mp4" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/이미지 형식/);
    });

    it("contentType 누락 → 400", async () => {
      const res = await request(app)
        .post("/api/upload/presign")
        .set("Cookie", cookies)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE upload — prefix 검증 ──────────────
  describe("DELETE /api/upload — Zod regex 안전망", () => {
    it("places/ 가 아닌 키 → 400 (다른 객체 삭제 방어)", async () => {
      const res = await request(app)
        .delete("/api/upload")
        .set("Cookie", cookies)
        .send({ key: "private/secret.jpg" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/허용된 경로/);
    });
  });
});
