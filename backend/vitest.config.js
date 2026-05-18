import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 매 test 파일 시작 전에 실행 — DB cleanup 등
    setupFiles: ["./tests/setup.js"],

    // 모든 테스트가 같은 PostgreSQL DB 를 공유하므로 동시 실행 시 race condition.
    // file 들도 sequential 로, 한 file 안의 it 들도 sequential 로 실행하도록 잠금.
    pool: "forks",
    forks: { singleFork: true },
    fileParallelism: false,
    sequence: { concurrent: false },

    // 테스트 전용 환경변수 — .env 의 운영 값보다 우선 적용
    env: {
      NODE_ENV: "test",
      // CI 에선 GitHub Actions 가 DATABASE_URL 을 set (localhost:5432).
      // 로컬은 5433 (호스트의 다른 postgres 와 충돌 회피한 매핑).
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://loci:loci@localhost:5433/loci_test",
      JWT_SECRET: process.env.JWT_SECRET || "test-secret-for-vitest-only-32-bytes",
      ALLOWED_ORIGINS: "http://localhost:5173",
      // 외부 호출 안 하는 자리표시자 (presign / upload 호출은 mock 하거나 skip)
      AWS_ACCESS_KEY_ID: "fake",
      AWS_SECRET_ACCESS_KEY: "fake",
      AWS_REGION: "ap-northeast-2",
      AWS_S3_BUCKET: "fake-bucket",
    },

    // 첫 query 가 늦어질 수 있어 기본 5s → 15s 로 여유
    testTimeout: 15000,
  },
});
