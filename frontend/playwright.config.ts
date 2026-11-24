import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4153";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 4153",
    url: baseURL,
  },
});
