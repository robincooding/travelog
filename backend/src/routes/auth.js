const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const {
  hashPassword,
  verifyPassword,
  signToken,
  buildCookieOptions,
  COOKIE_NAME,
} = require("../lib/auth");
const requireAuth = require("../middleware/requireAuth");

// 이메일 형식 — 너무 엄격하지 않은 실용형
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

// 응답에 절대 보내지 않을 필드 (특히 passwordHash)
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

// ── 회원가입 ──────────────────────────────────
// POST /api/auth/register  { email, password, displayName? }
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};

    // 입력 검증
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "유효한 이메일을 입력해주세요" });
    }
    if (!password || password.length < PASSWORD_MIN) {
      return res
        .status(400)
        .json({ error: `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요` });
    }

    // 이메일 중복 체크 (race condition 은 Prisma unique constraint 가 잡아줌)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "이미 가입된 이메일이에요" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName?.trim() || null,
      },
    });

    // 가입 직후 자동 로그인 — 토큰 발급 + 쿠키 설정
    const token = signToken({ id: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, buildCookieOptions());
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    // unique constraint 위반 등 race condition 안전망
    if (e.code === "P2002") {
      return res.status(409).json({ error: "이미 가입된 이메일이에요" });
    }
    res.status(500).json({ error: e.message });
  }
});

// ── 로그인 ────────────────────────────────────
// POST /api/auth/login  { email, password }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "이메일과 비밀번호를 입력해주세요" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // 보안: 사용자가 없을 때와 비밀번호가 틀릴 때를 똑같이 응답
    // → "이메일이 존재하는지" 정보 누출 방지
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않아요" });
    }

    const token = signToken({ id: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, buildCookieOptions());
    res.json({ user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 로그아웃 ──────────────────────────────────
// POST /api/auth/logout  (인증 불필요 — 어차피 쿠키 지우는 것뿐)
router.post("/logout", (req, res) => {
  // clearCookie 도 동일한 옵션(path, sameSite 등)을 줘야 브라우저가 매칭해서 지움
  res.clearCookie(COOKIE_NAME, buildCookieOptions());
  res.json({ ok: true });
});

// ── 현재 사용자 조회 ───────────────────────────
// GET /api/auth/me  (인증 필수)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      // 토큰은 유효한데 DB 에 없는 케이스 (탈퇴 등) — 쿠키 정리 + 401
      res.clearCookie(COOKIE_NAME, buildCookieOptions());
      return res.status(401).json({ error: "사용자를 찾을 수 없어요" });
    }
    res.json({ user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
