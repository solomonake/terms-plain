import "dotenv/config";
import { createApp } from "./app";

const app = createApp();

// Use the Render-provided port or fallback to 4000 for local dev
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

// Start server
app.listen(PORT, () => {
  console.log(`Termsplain API running on port ${PORT}`);
});
