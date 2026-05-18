/**
 * GET /api/collections — cursor pagination + search + theme filter.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });

describe("GET /api/collections — pagination / search / filter", () => {
  let cookies;

  beforeEach(async () => {
    const user = await createUser(app, { email: "lister@test.local" });
    cookies = user.cookies;
  });

  async function seedCollections(count, themeForAll = "카페") {
    // createdAt 순서 보장 위해 순차 생성
    const created = [];
    for (let i = 0; i < count; i++) {
      const res = await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({
          title: `컬렉션 ${String(i).padStart(2, "0")}`,
          theme: themeForAll,
          description: i % 3 === 0 ? "특별한 메모" : null,
        });
      created.push(res.body);
      // PostgreSQL createdAt 의 ms 해상도가 같을 수 있어 살짝 대기
      await new Promise((r) => setTimeout(r, 5));
    }
    return created;
  }

  // ── Pagination ─────────────────────────────
  describe("Pagination", () => {
    it("limit=10 으로 25개 → 첫 페이지 10개 + nextCursor 있음", async () => {
      await seedCollections(25);
      const res = await request(app)
        .get("/api/collections?limit=10")
        .set("Cookie", cookies);
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(10);
      expect(res.body.nextCursor).not.toBeNull();
    });

    it("cursor 따라가면서 전체 25개를 정확히 3페이지로 받음 (중복/누락 없음)", async () => {
      await seedCollections(25);
      const seen = new Set();
      let cursor = null;
      let pages = 0;

      while (true) {
        const url = `/api/collections?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
        const res = await request(app).get(url).set("Cookie", cookies);
        expect(res.status).toBe(200);

        for (const c of res.body.items) {
          expect(seen.has(c.id)).toBe(false); // 중복 없음
          seen.add(c.id);
        }
        pages++;

        if (!res.body.nextCursor) break;
        cursor = res.body.nextCursor;
        if (pages > 5) throw new Error("too many pages — cursor loop?");
      }

      expect(seen.size).toBe(25);
      expect(pages).toBe(3); // 10 + 10 + 5
    });

    it("마지막 페이지는 nextCursor=null", async () => {
      await seedCollections(7);
      const res = await request(app)
        .get("/api/collections?limit=10")
        .set("Cookie", cookies);
      expect(res.body.items).toHaveLength(7);
      expect(res.body.nextCursor).toBeNull();
    });

    it("내림차순 — 가장 최근 생성된 것이 첫 페이지 첫 번째", async () => {
      const created = await seedCollections(5);
      const last = created[created.length - 1]; // 가장 늦게 만든 컬렉션
      const res = await request(app)
        .get("/api/collections?limit=10")
        .set("Cookie", cookies);
      expect(res.body.items[0].id).toBe(last.id);
    });
  });

  // ── Search ──────────────────────────────────
  describe("Search", () => {
    it("title 부분 일치 — 대소문자 무관", async () => {
      await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "Tokyo Cafe Archive", theme: "카페" });
      await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "파리 미술관", theme: "전시" });

      const res = await request(app)
        .get("/api/collections?search=tokyo")
        .set("Cookie", cookies);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].title).toBe("Tokyo Cafe Archive");
    });

    it("description 도 검색 대상", async () => {
      await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "잡다한 메모", theme: "기타", description: "특별한 골목" });
      await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "일상 기록", theme: "기타", description: null });

      const res = await request(app)
        .get("/api/collections?search=골목")
        .set("Cookie", cookies);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].description).toContain("골목");
    });
  });

  // ── Theme filter ────────────────────────────
  describe("Theme filter", () => {
    it("정확히 일치하는 theme 만 반환", async () => {
      await seedCollections(3, "카페");
      await seedCollections(2, "전시");

      const res = await request(app)
        .get("/api/collections?theme=전시")
        .set("Cookie", cookies);
      expect(res.body.items).toHaveLength(2);
      res.body.items.forEach((c) => expect(c.theme).toBe("전시"));
    });
  });

  // ── 조합 + 입력 검증 ───────────────────────────
  describe("조합 + 검증", () => {
    it("search + theme + limit 동시 적용", async () => {
      await seedCollections(2, "카페"); // 컬렉션 00, 01
      await request(app)
        .post("/api/collections")
        .set("Cookie", cookies)
        .send({ title: "도쿄 카페", theme: "카페" });

      const res = await request(app)
        .get("/api/collections?theme=카페&search=도쿄&limit=10")
        .set("Cookie", cookies);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].title).toBe("도쿄 카페");
    });

    it("limit > 50 → 400", async () => {
      const res = await request(app)
        .get("/api/collections?limit=200")
        .set("Cookie", cookies);
      expect(res.status).toBe(400);
    });

    it("cursor 가 number 가 아닐 때 → 400", async () => {
      const res = await request(app)
        .get("/api/collections?cursor=abc")
        .set("Cookie", cookies);
      expect(res.status).toBe(400);
    });
  });
});
