const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  buildCookieOptions,
  COOKIE_NAME,
};
