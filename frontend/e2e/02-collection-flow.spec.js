import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/users.js";
import { apiPost, apiDelete } from "./helpers/api.js";

/**
 * 컬렉션 / 장소의 핵심 CRUD 흐름.
 *
 * 학습 포인트:
 *  - 일부 단계는 UI 클릭으로 (사용자 시각), 일부는 API 직접 호출로 (외부 SDK 의존 회피)
 *  - PlaceSearch 는 Google Places SDK 를 클릭으로 호출해야 하는데 E2E 에서 비용/flake.
 *    → 장소 추가는 page.request 로 API 직접, 표시는 UI 로 검증 — 가장 흔한 패턴
 *  - page.request 는 페이지의 인증 쿠키를 자동 사용 — 로그인된 상태 그대로 API 호출
 */

test.describe("컬렉션 CRUD", () => {
  test("새 컬렉션 만들기 → 목록 표시 → 상세 진입", async ({ page }) => {
    await registerAndLogin(page);

    // 빈 상태 메시지 확인
    await expect(page.getByText("아직 컬렉션이 없어요")).toBeVisible();

    // "첫 컬렉션 만들기" 또는 "+ 새 컬렉션" 둘 중 하나 클릭 (둘 다 가능)
    await page.getByRole("link", { name: /첫 컬렉션 만들기|새 컬렉션/ }).first().click();
    await page.waitForURL("**/collections/new");

    // 폼 작성
    await page.getByLabel("컬렉션 이름").fill("E2E 테스트 컬렉션");
    // 테마 칩 클릭으로 선택
    await page.getByRole("button", { name: "카페" }).click();
    await page.getByLabel(/설명/).fill("Playwright 가 만든 컬렉션");
    await page.getByRole("button", { name: "만들기" }).click();

    // 만들면 상세 페이지로 이동
    await page.waitForURL(/\/collections\/\d+$/);
    await expect(
      page.getByRole("heading", { name: "E2E 테스트 컬렉션" }),
    ).toBeVisible();

    // 아카이브 목록 돌아가 보기 — nav 의 "아카이브" 와 page-back "← 아카이브" 가
    // 둘 다 매칭되므로 exact: true 로 정확 일치만
    await page.getByRole("link", { name: "아카이브", exact: true }).click();
    await page.waitForURL("**/collections");
    await expect(page.getByText("E2E 테스트 컬렉션")).toBeVisible();
  });

  test("장소 추가 (API 직접) → 카드 클릭 → 상세 모달 표시 → ESC 로 닫기", async ({
    page,
  }) => {
    await registerAndLogin(page);

    // 1) 컬렉션 만들기 — apiPost helper 로 빠르게
    const collection = await apiPost(page, "/collections", {
      title: "모달 테스트 컬렉션",
      theme: "테스트",
    });

    // 2) 장소 추가 (PlaceSearch 우회 — 외부 SDK 의존 차단)
    await apiPost(page, "/places", {
      collectionId: collection.id,
      name: "Playwright 카페",
      address: "Test Street 1",
      city: "Tokyo",
      country: "Japan",
      lat: 35.6762,
      lng: 139.6503,
      category: "카페",
      curatorNote: "Playwright 가 만든 장소",
      highlight: "테스트 하이라이트",
      feeling: "안정적인",
      visitedAt: "2026-01-15",
    });

    // 3) 상세 페이지로 — UI 에서 카드 표시 확인
    await page.goto(`/collections/${collection.id}`);
    await expect(page.getByRole("heading", { name: "Playwright 카페" })).toBeVisible();

    // 4) 카드 클릭 → 모달 — PlaceCard 자체가 role="button"
    await page.getByRole("button", { name: /Playwright 카페/ }).first().click();

    // 모달의 콘텐츠 — 카드와 텍스트가 같으므로 dialog scope 안에서 찾기
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Playwright 가 만든 장소")).toBeVisible();
    await expect(modal.getByText("테스트 하이라이트")).toBeVisible();
    await expect(modal.getByText("안정적인")).toBeVisible();

    // 5) ESC 로 닫기
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("컬렉션 삭제 — 목록에서 사라짐", async ({ page }) => {
    await registerAndLogin(page);

    await apiPost(page, "/collections", { title: "남길 컬렉션", theme: "유지" });
    const target = await apiPost(page, "/collections", {
      title: "지울 컬렉션",
      theme: "삭제",
    });

    await page.goto("/collections");
    await expect(page.getByText("남길 컬렉션")).toBeVisible();
    await expect(page.getByText("지울 컬렉션")).toBeVisible();

    // API 로 삭제 (UI 의 카드별 delete 버튼이 호버 시에만 보여서 까다로움 — 학습 목적상 API)
    expect(await apiDelete(page, `/collections/${target.id}`)).toBe(true);

    await page.reload();
    await expect(page.getByText("남길 컬렉션")).toBeVisible();
    await expect(page.getByText("지울 컬렉션")).not.toBeVisible();
  });
});
