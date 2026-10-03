import { defineConfig } from "drizzle-kit";

const nodeProcess = process as NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

nodeProcess.loadEnvFile?.(".env.local");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL が設定されていません。");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
