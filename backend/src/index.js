const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth");
const collectionsRouter = require("./routes/collections");
const placesRouter = require("./routes/places");
const aiRouter = require("./routes/ai");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

// 인증 쿠키를 다른 origin (예: vite dev server) 에서도 받을 수 있도록 credentials 허용
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/places", placesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/upload", uploadRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
