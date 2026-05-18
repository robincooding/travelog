/**
 * 매 테스트마다 고유한 가짜 사용자 생성 — 시드 데이터 / 다른 테스트와 충돌 방지.
 *
 * 운영 DB (loci) 에 그대로 row 가 쌓이지만, 학습 단계라 허용.
 * 정리하고 싶다면 docker compose exec postgres psql -U loci -d loci -c
 *   "DELETE FROM \"User\" WHERE email LIKE 'e2e-%';"
 */
export function makeFakeUser() {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `e2e-${uid}@test.local`,
    password: "playwright-test-12345",
    displayName: `테스터-${uid.slice(-4)}`,
  };
}

/**
 * 가입 + 자동 로그인까지 한 번에 — 매 테스트의 setup 반복 줄임.
 * 반환: { user, page } — page 는 그대로 사용
 */
export async function registerAndLogin(page) {
  const user = makeFakeUser();
  await page.goto("/register");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel(/비밀번호/).fill(user.password);
  await page.getByLabel(/표시 이름/).fill(user.displayName);
  await page.getByRole("button", { name: "계정 만들기" }).click();
  await page.waitForURL("**/collections");
  return user;
}
