const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRouter = require("./routes/auth");
const collectionsRouter = require("./routes/collections");
const placesRouter = require("./routes/places");
const aiRouter = require("./routes/ai");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

// ── 보안 헤더 (helmet) ──────────────────────────
// 기본 보안 헤더 (X-Frame-Options / X-Content-Type-Options / Strict-Transport-Security 등) 자동 적용.
// API 서버라 CSP 는 비활성 (프론트엔드 nginx 에서 별도 관리 가능).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ── CORS 화이트리스트 ───────────────────────────
// origin 을 정확히 일치하는 값만 허용. 환경변수로 운영 도메인 추가 가능.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:8080"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // origin === undefined: same-origin / curl / Postman 등 — 허용
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ── Rate limit ─────────────────────────────────
// 글로벌: IP 당 1분에 100 요청. 정상 사용에는 충분, 자동화 / DoS 차단.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
});

// 인증 / 비밀번호 라우트: IP 당 1분에 10 요청. brute-force 방어.
// 성공 요청은 카운팅에서 제외 — 정상 사용자가 막히지 않도록.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." },
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// 인증 민감 엔드포인트엔 더 빡빡한 limit 을 먼저 적용
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// 글로벌 limit 은 모든 /api 에 적용
app.use("/api", globalLimiter);

app.use("/api/auth", authRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/places", placesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/upload", uploadRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
