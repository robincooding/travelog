import { defineConfig, devices } from "@playwright/test";

/**
 * Loci E2E config — docker compose 의 frontend (8080) 에 붙어 실제 UI 흐름 검증.
 *
 * 학습 노트:
 * - workers: 1 — 모든 테스트가 같은 backend / DB 를 공유. 병렬은 race 위험
 * - retries: CI 에선 2, 로컬은 0 — flake 자동 재시도는 CI 에서만
 * - trace: "on-first-retry" — 첫 실패 후 재시도 시 trace 기록 → trace viewer 로 step-by-step 재현
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
