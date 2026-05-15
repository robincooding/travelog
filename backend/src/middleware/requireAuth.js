const { verifyToken, COOKIE_NAME } = require("../lib/auth");

/**
 * 인증 필수 미들웨어.
 * - 요청 쿠키에서 토큰을 꺼내 검증
 * - 성공 시 req.user = { id, email } 를 다음 핸들러로 전달
 * - 실패 시 401 응답
 *
 * 사용법:
 *   router.get("/me", requireAuth, (req, res) => { ... req.user.id ... })
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "로그인이 필요해요" });
  }

  try {
    const payload = verifyToken(token);
    // payload 예: { id: 1, email: "foo@bar.com", iat: ..., exp: ... }
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (e) {
    // 만료 / 조작 / 잘못된 시그니처 모두 여기서 잡힘
    return res.status(401).json({ error: "유효하지 않은 세션이에요" });
  }
}

module.exports = requireAuth;
