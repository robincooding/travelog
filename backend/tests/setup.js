/**
 * Vitest 전역 설정 — 매 test 파일 시작 / 종료 시 hook.
 *
 * - beforeEach: 모든 DB row 삭제 → 테스트 격리
 *   (각 테스트가 깨끗한 상태에서 시작, 다른 테스트가 만든 데이터 영향 없음)
 * - afterAll:   Prisma connection pool 종료 → vitest 가 깔끔하게 끝남
 */
/**
 * Vitest 전역 설정 — 매 test 전에 DB 를 깨끗하게 비우고, 모든 test 종료 시 connection 정리.
 *
 * 주의: vitest.config.js 의 `isolate: false` 가 함께 필요.
 *   isolate:true (기본) 이면 매 test file 마다 새 module context 가 만들어져
 *   prisma client 가 여러 번 instantiate → 같은 DB 에 race 발생.
 */
import { beforeEach, afterAll } from "vitest";

const prisma = require("../src/lib/prisma");
console.log(`[setup] eval, prisma id=${prisma.__id ?? (prisma.__id = Math.random().toString(36).slice(2,6))}`);

beforeEach(async () => {
  // FK 의존 순서 — 자식 → 부모
  await prisma.aiUsageDaily.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.collectionProfile.deleteMany();
  await prisma.place.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
