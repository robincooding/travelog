const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { createApp } = require("./app");

const app = createApp();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
