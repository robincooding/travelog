/**
 * Wishlist — 본인 것만 CRUD, 중복 추가 차단, 멀티 테넌시 격리.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createUser } from "./helpers/auth.js";

const app = createApp({ enableRateLimit: false });

describe("Wishlist", () => {
  let alice, bob, aliceCollection;
  beforeEach(async () => {
    alice = await createUser(app, { email: "alice@test.local" });
    bob = await createUser(app, { email: "bob@test.local" });

    const c = await request(app)
      .post("/api/collections")
      .set("Cookie", alice.cookies)
      .send({ title: "앨리스 컬렉션", theme: "테스트" });
    aliceCollection = c.body;
  });

  it("추가 → 목록에 반영", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({
        name: "Blue Bottle (도쿄, 일본)",
        city: "도쿄",
        country: "일본",
        sourceCollectionId: aliceCollection.id,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Blue Bottle (도쿄, 일본)");
    expect(res.body.userId).toBe(alice.user.id);

    const list = await request(app)
      .get("/api/wishlist")
      .set("Cookie", alice.cookies);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].name).toBe("Blue Bottle (도쿄, 일본)");
  });

  it("같은 name 중복 추가 → 409", async () => {
    await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "같은 이름" });

    const res = await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "같은 이름" });
    expect(res.status).toBe(409);
  });

  it("이름 빈 문자열 → 400", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("bob 이 alice 의 sourceCollectionId 로 주입 시도 → 404", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Cookie", bob.cookies)
      .send({
        name: "도용 시도",
        sourceCollectionId: aliceCollection.id,
      });
    expect(res.status).toBe(404);
  });

  it("멀티 테넌시 — bob 목록에 alice 것 안 보임", async () => {
    await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "앨리스의 위시" });

    const res = await request(app)
      .get("/api/wishlist")
      .set("Cookie", bob.cookies);
    expect(res.body.items).toHaveLength(0);
  });

  it("같은 name 도 다른 user 면 OK", async () => {
    await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "공통 장소" });

    const res = await request(app)
      .post("/api/wishlist")
      .set("Cookie", bob.cookies)
      .send({ name: "공통 장소" });
    expect(res.status).toBe(201);
  });

  it("bob 이 alice 의 위시 삭제 시도 → 404", async () => {
    const create = await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "앨리스 것" });

    const del = await request(app)
      .delete(`/api/wishlist/${create.body.id}`)
      .set("Cookie", bob.cookies);
    expect(del.status).toBe(404);

    // 여전히 alice 의 위시에는 살아있음
    const list = await request(app)
      .get("/api/wishlist")
      .set("Cookie", alice.cookies);
    expect(list.body.items).toHaveLength(1);
  });

  it("본인 위시 삭제 → 204, 목록에서 사라짐", async () => {
    const create = await request(app)
      .post("/api/wishlist")
      .set("Cookie", alice.cookies)
      .send({ name: "삭제 대상" });

    const del = await request(app)
      .delete(`/api/wishlist/${create.body.id}`)
      .set("Cookie", alice.cookies);
    expect(del.status).toBe(204);

    const list = await request(app)
      .get("/api/wishlist")
      .set("Cookie", alice.cookies);
    expect(list.body.items).toHaveLength(0);
  });

  it("비로그인 → 401", async () => {
    const res = await request(app).get("/api/wishlist");
    expect(res.status).toBe(401);
  });
});
