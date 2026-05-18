/**
 * 멀티 테넌시 / 소유권 테스트.
 *
 * 우리 프로젝트의 가장 중요한 보안 회귀 위험:
 *   "한 사용자가 다른 사용자의 컬렉션 / 장소를 보거나 / 수정하거나 / 삭제할 수 있는가?"
 *
 * 모든 케이스에서 **404** 응답이어야 함 (403 이 아닌 이유는 IDOR / enumeration 차단 —
 * 리소스 존재 자체를 노출하지 않음).
 *
 * 또한 단순히 status 만 보지 않고, 변경 시도 후 원본이 그대로인지 alice 시점에서
 * 다시 조회해 verify — "404 응답했지만 실제로는 변경됐다" 같은 함정 차단.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });

// ── 컬렉션 격리 ────────────────────────────────
describe("멀티 테넌시 — 컬렉션", () => {
  let alice, bob, aliceCollection;

  beforeEach(async () => {
    alice = await createUser(app, { email: "alice@test.local" });
    bob = await createUser(app, { email: "bob@test.local" });

    const res = await request(app)
      .post("/api/collections")
      .set("Cookie", alice.cookies)
      .send({ title: "앨리스의 카페", theme: "카페" });
    aliceCollection = res.body;
  });

  it("bob 목록에 alice 컬렉션이 보이지 않음", async () => {
    const res = await request(app)
      .get("/api/collections")
      .set("Cookie", bob.cookies);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("bob 이 alice 컬렉션 GET → 404", async () => {
    const res = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", bob.cookies);
    expect(res.status).toBe(404);
  });

  it("bob 이 alice 컬렉션 PUT → 404, 원본 보존", async () => {
    const res = await request(app)
      .put(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", bob.cookies)
      .send({ title: "해킹됨", theme: "악의" });
    expect(res.status).toBe(404);

    // alice 시점에서 원본 그대로인지 확인
    const verify = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", alice.cookies);
    expect(verify.body.title).toBe("앨리스의 카페");
  });

  it("bob 이 alice 컬렉션 DELETE → 404, 컬렉션 살아있음", async () => {
    const res = await request(app)
      .delete(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", bob.cookies);
    expect(res.status).toBe(404);

    const verify = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", alice.cookies);
    expect(verify.status).toBe(200);
  });

  it("alice 는 본인 컬렉션 정상 접근", async () => {
    const res = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", alice.cookies);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("앨리스의 카페");
  });

  it("POST /collections — body 의 userId 주입 시도 무시 (IDOR 차단)", async () => {
    // bob 이 body 에 userId: alice.id 를 명시해도 서버가 무시하고 본인 id 로 저장
    const res = await request(app)
      .post("/api/collections")
      .set("Cookie", bob.cookies)
      .send({
        title: "주입 시도",
        theme: "테스트",
        userId: alice.user.id, // 무시되어야 함
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(bob.user.id);
    expect(res.body.userId).not.toBe(alice.user.id);
  });
});

// ── 장소 격리 — 부모 컬렉션 소유권 ──────────────
describe("멀티 테넌시 — 장소", () => {
  let alice, bob, aliceCollection, alicePlace;

  beforeEach(async () => {
    alice = await createUser(app, { email: "alice@test.local" });
    bob = await createUser(app, { email: "bob@test.local" });

    const c = await request(app)
      .post("/api/collections")
      .set("Cookie", alice.cookies)
      .send({ title: "앨리스 컬렉션", theme: "카페" });
    aliceCollection = c.body;

    const p = await request(app)
      .post("/api/places")
      .set("Cookie", alice.cookies)
      .send({
        collectionId: aliceCollection.id,
        name: "앨리스의 장소",
        lat: 37.5,
        lng: 127.0,
        visitedAt: "2026-01-01",
      });
    alicePlace = p.body;
  });

  it("bob 이 alice 컬렉션에 장소 추가 → 404", async () => {
    const res = await request(app)
      .post("/api/places")
      .set("Cookie", bob.cookies)
      .send({
        collectionId: aliceCollection.id,
        name: "악의적 장소",
        lat: 0,
        lng: 0,
        visitedAt: "2026-01-01",
      });
    expect(res.status).toBe(404);

    // alice 시점에서 장소 그대로 1개
    const verify = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", alice.cookies);
    expect(verify.body.places).toHaveLength(1);
  });

  it("bob 이 alice 장소 PUT → 404, 원본 보존", async () => {
    const res = await request(app)
      .put(`/api/places/${alicePlace.id}`)
      .set("Cookie", bob.cookies)
      .send({ name: "해킹됨", lat: 0, lng: 0, visitedAt: "2026-01-01" });
    expect(res.status).toBe(404);

    const verify = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", alice.cookies);
    expect(verify.body.places[0].name).toBe("앨리스의 장소");
  });

  it("bob 이 alice 장소 DELETE → 404, 장소 살아있음", async () => {
    const res = await request(app)
      .delete(`/api/places/${alicePlace.id}`)
      .set("Cookie", bob.cookies);
    expect(res.status).toBe(404);

    const verify = await request(app)
      .get(`/api/collections/${aliceCollection.id}`)
      .set("Cookie", alice.cookies);
    expect(verify.body.places).toHaveLength(1);
  });

  it("bob 이 GET /places/collection/{aliceCollectionId} → 404", async () => {
    const res = await request(app)
      .get(`/api/places/collection/${aliceCollection.id}`)
      .set("Cookie", bob.cookies);
    expect(res.status).toBe(404);
  });
});

// ── AI 라우터 — 소유권 ────────────────────────
describe("멀티 테넌시 — AI", () => {
  it("bob 이 alice 컬렉션에 AI 분석 요청 → 404", async () => {
    const alice = await createUser(app, { email: "alice@test.local" });
    const bob = await createUser(app, { email: "bob@test.local" });

    const c = await request(app)
      .post("/api/collections")
      .set("Cookie", alice.cookies)
      .send({ title: "앨리스", theme: "카페" });

    const res = await request(app)
      .post(`/api/ai/profile/${c.body.id}`)
      .set("Cookie", bob.cookies);
    expect(res.status).toBe(404);
  });
});
