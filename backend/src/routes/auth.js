const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const {
  hashPassword,
  verifyPassword,
  signToken,
  buildCookieOptions,
  COOKIE_NAME,
  generateResetToken,
  hashResetToken,
  resetTokenExpiresAt,
} = require("../lib/auth");
const requireAuth = require("../middleware/requireAuth");
const { validate, z } = require("../lib/validate");

// ── 입력 스키마 ────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 해요"),
  displayName: z.string().trim().max(40).optional(),
});

const LoginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "유효한 토큰이 아니에요"),
  newPassword: z.string().min(8, "비밀번호는 8자 이상이어야 해요"),
});

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
router.post("/register", validate(RegisterSchema), async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

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
        displayName: displayName || null,
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
router.post("/login", validate(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

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

// ── 비밀번호 재설정 요청 ───────────────────────
// POST /api/auth/forgot-password  { email }
// 이메일 존재 여부를 응답으로 누출하지 않음 — 존재 / 미존재 모두 같은 응답.
router.post("/forgot-password", validate(ForgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // 평문 토큰은 응답으로도, DB 로도 가지 않음. 오직 사용자 이메일(또는 콘솔)로만 전달.
      const token = generateResetToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: resetTokenExpiresAt(),
        },
      });

      // 학습 단계: 실제 이메일 발송 대신 콘솔에 출력.
      // 프론트엔드 URL — 운영 환경에선 FRONTEND_URL 같은 env 로 받아야 함.
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      console.log("\n📧 [비밀번호 재설정 링크 — 메일 발송 대체]");
      console.log(`   사용자: ${user.email}`);
      console.log(`   링크:   ${resetUrl}`);
      console.log(`   (1시간 후 만료)\n`);
    }

    // 사용자가 있건 없건 항상 같은 응답 → 이메일 존재 여부 누출 차단
    res.json({
      ok: true,
      message: "가입된 이메일이면 재설정 링크를 보내드렸어요",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 비밀번호 재설정 실행 ───────────────────────
// POST /api/auth/reset-password  { token, newPassword }
router.post("/reset-password", validate(ResetPasswordSchema), async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      include: { user: true },
    });

    // 토큰 검증 — 4가지 조건 모두 통과해야 함
    if (
      !record ||
      record.usedAt ||
      record.expiresAt < new Date() ||
      !record.user
    ) {
      return res
        .status(400)
        .json({ error: "유효하지 않거나 만료된 링크에요" });
    }

    const passwordHash = await hashPassword(newPassword);

    // 1) 비번 갱신  2) 토큰 사용 처리 — 트랜잭션으로 묶어 일관성 보장
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // 같은 사용자의 다른 미사용 토큰도 모두 무효화 (보안)
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
