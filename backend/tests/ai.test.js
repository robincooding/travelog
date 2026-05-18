/**
 * AI 라우터 — 캐시 / 한도 / force 동작 테스트.
 *
 * Gemini API 는 실제 호출하지 않음 — global.fetch 를 mock 으로 교체해
 * 결정적 응답을 돌려주고 외부 의존 / 비용 차단.
 *
 * 학습 포인트:
 *  - vi.fn() 으로 외부 호출 mock
 *  - 캐시 hit: cached: true, Gemini 호출 X, 한도 차감 X
 *  - force=true: 캐시 무시 + Gemini 호출 + 한도 차감
 *  - 한도 (DAILY_LIMIT=5) 초과 시 429
 *  - 트랜잭션 — Gemini 성공 후에만 카운터 증가
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });
const prisma = require("../src/lib/prisma");

// Gemini 응답 mock — JSON parsing 가능한 형태로 (라우터가 ```json``` 마크다운 제거함)
function mockGeminiResponse(payload) {
  return {
    json: async () => ({
      candidates: [
        {
          content: { parts: [{ text: JSON.stringify(payload) }] },
        },
      ],
    }),
  };
}

const FAKE_AI = {
  themeType: "테스트 유형",
  summary: "테스트 요약",
  recommendations: ["장소A (서울, 한국)", "장소B (도쿄, 일본)"],
};

describe("AI — 캐시 / 한도 / force", () => {
  let cookies, collectionId;
  let fetchSpy;

  beforeEach(async () => {
    // 외부 fetch mock
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockGeminiResponse(FAKE_AI));

    const user = await createUser(app, { email: "ai@test.local" });
    cookies = user.cookies;
    const c = await request(app)
      .post("/api/collections")
      .set("Cookie", cookies)
      .send({ title: "AI 테스트", theme: "카페" });
    collectionId = c.body.id;
  });

  it("첫 호출 — Gemini 호출, cached:false, 한도 1회 차감", async () => {
    const res = await request(app)
      .post(`/api/ai/profile/${collectionId}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(res.body.themeType).toBe("테스트 유형");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const usage = await prisma.aiUsageDaily.findMany();
    expect(usage[0].count).toBe(1);
  });

  it("두 번째 호출 (force 없음) — 캐시 hit, Gemini 호출 X, 한도 차감 X", async () => {
    // 1차 호출
    await request(app)
      .post(`/api/ai/profile/${collectionId}`)
      .set("Cookie", cookies);
    fetchSpy.mockClear();

    // 2차 호출 — force 없음
    const res = await request(app)
      .post(`/api/ai/profile/${collectionId}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    // 한도는 그대로 1
    const usage = await prisma.aiUsageDaily.findMany();
    expect(usage[0].count).toBe(1);
  });

  it("force=true — 캐시 무시 + 한도 차감", async () => {
    // 1차 호출 (캐시 채우기)
    await request(app)
      .post(`/api/ai/profile/${collectionId}`)
      .set("Cookie", cookies);
    fetchSpy.mockClear();

    // force=true
    const res = await request(app)
      .post(`/api/ai/profile/${collectionId}?force=true`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const usage = await prisma.aiUsageDaily.findMany();
    expect(usage[0].count).toBe(2);
  });

  it("한도 5회 초과 → 429", async () => {
    // force 로 5회 누적
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post(`/api/ai/profile/${collectionId}?force=true`)
        .set("Cookie", cookies);
      expect(res.status).toBe(200);
    }

    // 6번째 force → 429
    const res = await request(app)
      .post(`/api/ai/profile/${collectionId}?force=true`)
      .set("Cookie", cookies);
    expect(res.status).toBe(429);
    expect(res.body.limit).toBe(5);
    expect(res.body.used).toBe(5);
  });

  it("한도 도달 후에도 캐시 호출은 정상", async () => {
    // 5회 채움
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/ai/profile/${collectionId}?force=true`)
        .set("Cookie", cookies);
    }

    // force 없이 호출 — 캐시 hit 라 한도 무관
    const res = await request(app)
      .post(`/api/ai/profile/${collectionId}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
  });

  it("Gemini 호출 실패 시 한도 차감 안 됨 (트랜잭션 무결성)", async () => {
    // mock 을 실패로 교체
    fetchSpy.mockResolvedValueOnce({
      json: async () => ({ candidates: [] }), // text 없음 → 라우터가 500 반환
    });

    const res = await request(app)
      .post(`/api/ai/profile/${collectionId}?force=true`)
      .set("Cookie", cookies);
    expect(res.status).toBe(500);

    // 한도 row 가 안 만들어졌어야 함
    const usage = await prisma.aiUsageDaily.findMany();
    expect(usage).toHaveLength(0);
  });
});
