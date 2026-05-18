/**
 * 테스트 공통 — 사용자 생성 / 로그인 / 쿠키 추출 헬퍼.
 *
 * supertest 는 응답 쿠키를 자동 추적하지 않으므로 (브라우저 다름),
 * 후속 요청에 `.set("Cookie", cookies)` 로 명시 전달 필요.
 */
import request from "supertest";

const DEFAULT_PASSWORD = "test-password-1234";

/**
 * 새 사용자 생성 + 응답으로 받은 쿠키 추출.
 * @returns {{ user, cookies, response }} cookies 는 set-cookie 헤더 (배열)
 */
export async function createUser(app, overrides = {}) {
  const payload = {
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`,
    password: DEFAULT_PASSWORD,
    displayName: "테스터",
    ...overrides,
  };
  const response = await request(app).post("/api/auth/register").send(payload);
  return {
    user: response.body.user,
    password: payload.password, // 후속 login 테스트용
    cookies: response.headers["set-cookie"] || [],
    response,
  };
}

export async function loginAs(app, email, password) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return {
    user: response.body.user,
    cookies: response.headers["set-cookie"] || [],
    response,
  };
}
