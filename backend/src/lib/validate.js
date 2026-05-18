const { z } = require("zod");

/**
 * Express 용 Zod 검증 미들웨어.
 *
 * - safeParse 로 throw 없이 결과 확인
 * - 실패 시 첫 번째 에러 메시지를 사용자 응답으로, 전체는 issues 배열로 함께 전달
 * - 성공 시 req[source] 를 검증·변환된 데이터로 교체 (trim / coerce 등이 반영된 깨끗한 값)
 *
 * 사용법:
 *   router.post('/register', validate(RegisterSchema), handler)
 *   router.post('/places', validate(CreatePlaceSchema, 'body'), handler)
 *   router.post('/ai/profile/:id', validate(IdParamSchema, 'params'), handler)
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({
        error: issues[0]?.message || "잘못된 요청이에요",
        issues,
      });
    }
    // body 는 mutable 이라 그대로 덮어씀 (기존 라우터 호환).
    // query / params 는 Express 5 에서 getter 라 재할당 silent 무시 →
    // req.validated 별도 컨테이너에 보관.
    if (source === "body") {
      req.body = result.data;
    } else {
      req.validated = req.validated || {};
      req.validated[source] = result.data;
    }
    next();
  };
}

module.exports = { validate, z };
