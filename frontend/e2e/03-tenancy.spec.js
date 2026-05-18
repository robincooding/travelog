import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/users.js";
import { apiPost, apiGet } from "./helpers/api.js";

/**
 * 멀티 테넌시 — 사용자 격리가 UI 까지 전부 동작하는지.
 *
 * 학습 포인트:
 *  - 두 개의 독립 context (각자 쿠키 보관) 사용해서 두 사용자 동시 시뮬레이션
 *  - 백엔드 단위 테스트(tenancy.test.js) 는 응답 404 만 보지만,
 *    E2E 는 "사용자가 보는 UI" 에서도 격리되어 있음을 검증
 */

test.describe("멀티 테넌시 — UI 레벨 격리", () => {
  test("alice 의 컬렉션이 bob 의 목록에 보이지 않음", async ({ browser }) => {
    // 두 독립 context = 두 독립 브라우저 세션 (쿠키 분리)
    const aliceContext = await browser.newContext();
    const bobContext = await browser.newContext();
    const alice = await aliceContext.newPage();
    const bob = await bobContext.newPage();

    try {
      // 1) alice 가 가입 + 컬렉션 생성
      await registerAndLogin(alice);
      await apiPost(alice, "/collections", {
        title: "앨리스의 비밀 컬렉션",
        theme: "비밀",
      });

      // 2) bob 이 별도 세션으로 가입
      await registerAndLogin(bob);

      // 3) bob 의 아카이브 — 비어 있어야 함 (alice 의 것 안 보임)
      await expect(bob.getByText("아직 컬렉션이 없어요")).toBeVisible();
      await expect(bob.getByText("앨리스의 비밀 컬렉션")).not.toBeVisible();

      // 4) bob 이 alice 의 컬렉션 ID 를 추측해 직접 URL 접근 → 가드는 통과 하지만
      //    백엔드가 404 반환 → 상세 페이지가 로딩 상태에서 멈춤 (collection.value null)
      const aliceList = await apiGet(alice, "/collections");
      const aliceCollection = aliceList.items[0];

      await bob.goto(`/collections/${aliceCollection.id}`);
      // alice 의 컬렉션 제목은 절대 보이면 안 됨
      await bob.waitForTimeout(500);
      await expect(bob.getByText("앨리스의 비밀 컬렉션")).not.toBeVisible();
    } finally {
      await aliceContext.close();
      await bobContext.close();
    }
  });
});
