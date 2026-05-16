const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

/**
 * 인증 관련 공통 유틸 모음.
 * - 비밀번호 해싱 / 검증 (bcrypt)
 * - JWT 발급 / 검증
 * - 쿠키 설정 (httpOnly 보안 옵션)
 */

const BCRYPT_COST = 10;             // 비밀번호 해시 강도 (높을수록 안전 but 느림)
const TOKEN_EXPIRES = "7d";          // access token 만료 기간
const COOKIE_NAME = "loci_token";    // httpOnly 쿠키 이름

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 이 설정되지 않았습니다. .env 를 확인하세요.");
  }
  return secret;
}

// ── 비밀번호 ──────────────────────────────────
async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── JWT ──────────────────────────────────────
function signToken(payload) {
  // payload 에는 식별 가능한 최소 정보만 넣음. 비밀번호 / 민감 정보 금지.
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_EXPIRES });
}

function verifyToken(token) {
  // 검증 실패 시 throw — caller 가 try/catch
  return jwt.verify(token, getSecret());
}

// ── 쿠키 ─────────────────────────────────────
// httpOnly: JS 에서 못 읽음 → XSS 공격으로 토큰 탈취 불가
// sameSite: CSRF 방어 (다른 도메인 form 으로 자동 전송 차단)
// secure: HTTPS 에서만 전송 (운영 환경)
function buildCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 일 (ms)
    path: "/",
  };
}

// ── 비밀번호 재설정 토큰 ────────────────────────
// 토큰은 64자 hex (256-bit 엔트로피) — 추측 불가능.
// DB 에는 SHA-256 hash 만 저장 (DB 유출 시에도 토큰 그대로 못 씀).
// bcrypt 안 쓰는 이유: 토큰 자체가 이미 고엔트로피라 무차별 대입 위험이 없음 + 검증 시 빠른 lookup 필요.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 시간

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function resetTokenExpiresAt() {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  buildCookieOptions,
  COOKIE_NAME,
  generateResetToken,
  hashResetToken,
  resetTokenExpiresAt,
};
