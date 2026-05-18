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

/**
 * Express app 생성 — listen 호출은 별도(index.js).
 * 테스트에서는 supertest 가 in-process 로 호출하므로 listen 불필요.
 *
 * @param {object} options
 * @param {boolean} [options.enableRateLimit=true]
 *   테스트 중 같은 IP 에서 다수 요청이 한도에 걸리지 않도록 끌 수 있음.
 *   (rate limit 자체를 검증하는 테스트만 true 로 켬)
 */
function createApp({ enableRateLimit = true } = {}) {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:8080"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
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

  if (enableRateLimit) {
    const globalLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
    });

    const authLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      message: { error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." },
    });

    app.use("/api/auth/login", authLimiter);
    app.use("/api/auth/register", authLimiter);
    app.use("/api/auth/forgot-password", authLimiter);
    app.use("/api/auth/reset-password", authLimiter);
    app.use("/api", globalLimiter);
  }

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/places", placesRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/upload", uploadRouter);

  return app;
}

module.exports = { createApp };
