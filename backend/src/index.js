const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");

const travelRouter = require("./routes/travels");
const placesRouter = require("./routes/places");
const orderRouter = require("./routes/orders");
const aiRouter = require("./routes/ai");
const exportRouter = require("./routes/export");

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/travels", travelRouter);
app.use("/api/places", placesRouter);
app.use("/api/orders", orderRouter);
app.use("/api/ai", aiRouter);
app.use("/api/export", exportRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
