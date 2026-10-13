import { z } from "zod";
import { existsSync } from "node:fs";

const schema = z.object({
  APP_ENV: z.enum(["fixture", "developer", "production"]).default("fixture"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().optional(),
  AIGZM_API_ORIGIN: z.string().url().default("https://aigzm.com"),
  AIGZM_MODEL_KEY: z.string().min(1).default("deepseek-v4-flash"),
  AIGZM_API_KEY: z.string().optional(),
  AIGZM_AUTHORIZATION_UI_ORIGIN: z.string().url().default("https://aigzm.com"),
  AIGZM_CLIENT_ID: z.string().optional(),
  AIGZM_CLIENT_SECRET: z.string().optional(),
  AIGZM_REDIRECT_URI: z.string().url().optional(),
  AIGZM_EXPECTED_ISSUER: z.string().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env === process.env && process.env.NODE_ENV !== "test" && existsSync(".env")) process.loadEnvFile(".env");
  const cfg = schema.parse(env);
  if (cfg.APP_ENV === "production" && (!cfg.DATABASE_URL || !cfg.AIGZM_CLIENT_ID || !cfg.AIGZM_CLIENT_SECRET || !cfg.AIGZM_REDIRECT_URI || !cfg.AIGZM_EXPECTED_ISSUER || !cfg.SESSION_SECRET)) {
    throw new Error("Production requires DATABASE_URL, AIGZM OAuth configuration, and SESSION_SECRET");
  }
  return cfg;
}
