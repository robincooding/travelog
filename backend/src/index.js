const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");

const collectionsRouter = require("./routes/collections");
const placesRouter = require("./routes/places");
const ordersRouter = require("./routes/orders");
const aiRouter = require("./routes/ai");
const exportRouter = require("./routes/export");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/collections", collectionsRouter);
app.use("/api/places", placesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/ai", aiRouter);
app.use("/api/export", exportRouter);
app.use("/api/upload", uploadRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
