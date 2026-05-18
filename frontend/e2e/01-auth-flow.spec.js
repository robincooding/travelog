import { test, expect } from "@playwright/test";
import { makeFakeUser } from "./helpers/users.js";

/**
 * 사용자 인증의 핵심 흐름을 실제 브라우저에서 검증.
 *
 * 학습 포인트:
 *  - getByRole / getByLabel — DOM 구조보다 의미(role)와 라벨로 locator
 *    → CSS / 마크업 변경에 강건. 접근성 검증도 부산물로 따라옴
 *  - expect(locator).toBeVisible() — auto-waiting. 명시적 sleep 없음
 *  - page.url() / waitForURL() — 라우터 가드의 redirect 검증
 */

test.describe("인증 흐름", () => {
  test("가입 → 자동 로그인 → 아카이브 진입", async ({ page }) => {
    const user = makeFakeUser();

    await page.goto("/register");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel(/비밀번호/).fill(user.password);
    await page.getByLabel(/표시 이름/).fill(user.displayName);
    await page.getByRole("button", { name: "계정 만들기" }).click();

    // 가입 직후 /collections 로 리다이렉트
    await page.waitForURL("**/collections");
    await expect(page.getByRole("heading", { name: "내 아카이브" })).toBeVisible();

    // 네비에 사용자 표시 이름 노출
    await expect(page.getByRole("link", { name: user.displayName })).toBeVisible();
  });

  test("로그아웃 → /login 으로 이동, 보호된 페이지 접근 시 redirect", async ({
    page,
  }) => {
    const user = makeFakeUser();

    // 가입
    await page.goto("/register");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel(/비밀번호/).fill(user.password);
    await page.getByRole("button", { name: "계정 만들기" }).click();
    await page.waitForURL("**/collections");

    // 로그아웃
    await page.getByRole("button", { name: "로그아웃" }).click();
    await page.waitForURL("**/login");

    // /collections 직접 진입 시도 → /login 으로 다시 redirect (라우트 가드)
    await page.goto("/collections");
    await page.waitForURL(/\/login(\?.*)?$/);
    await expect(page).toHaveURL(/redirect=.*collections/);
  });

  test("로그인 후 ?redirect= 의 원래 경로로 복귀", async ({ page }) => {
    const user = makeFakeUser();
    // 가입 → 로그아웃 (계정 만들기용)
    await page.goto("/register");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel(/비밀번호/).fill(user.password);
    await page.getByRole("button", { name: "계정 만들기" }).click();
    await page.waitForURL("**/collections");
    await page.getByRole("button", { name: "로그아웃" }).click();
    await page.waitForURL("**/login");

    // /collections/new 직접 → /login?redirect=/collections/new 로
    await page.goto("/collections/new");
    await page.waitForURL(/redirect=.*collections.*new/);

    // 로그인
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill(user.password);
    await page.getByRole("button", { name: "로그인" }).click();

    // 원래 가려던 /collections/new 로 자동 복귀
    await page.waitForURL("**/collections/new");
  });
});
