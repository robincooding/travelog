const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// TODO: mount routes
// app.use("/travels", require("./routes/travels"));
// app.use("/places", require("./routes/places"));
// app.use("/orders", require("./routes/orders"));
// app.use("/export", require("./routes/export"));
// app.use("/ai", require("./routes/ai"));

const port = Number(process.env.BACKEND_PORT) || 3000;
app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
