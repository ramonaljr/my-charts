import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load base .env then override with .env.local if present so local dev keys apply
// Check both local directory and monorepo root
dotenv.config({ path: ".env" });

const localEnvPaths = [
  ".env.local",
  path.resolve(__dirname, "../../../../.env.local"), // monorepo root
];

for (const envPath of localEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

function getEnv(key: string, fallback?: string) {
  const value = process.env[key] ?? fallback;
  return value;
}

function getNumber(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const env = {
  port: getNumber("PORT", 4000),
  finnhubApiKey: getEnv("FINNHUB_API_KEY"),
  fmpApiKey: getEnv("FMP_API_KEY"),
  alphaVantageApiKey: getEnv("ALPHA_VANTAGE_API_KEY"),
  twelveDataApiKey: getEnv("TWELVE_DATA_API_KEY"),
  databaseUrl: getEnv("DATABASE_URL", "file:./prisma/dev.db"),
  smtp: {
    host: getEnv("SMTP_HOST"),
    port: getNumber("SMTP_PORT", 587),
    user: getEnv("SMTP_USER"),
    pass: getEnv("SMTP_PASS"),
    from: getEnv("SMTP_FROM"),
    to: getEnv("ALERT_EMAIL_TO"),
  },
};

export function warnMissingEnv() {
  const missing: string[] = [];
  if (!env.finnhubApiKey) missing.push("FINNHUB_API_KEY");
  if (!env.fmpApiKey) missing.push("FMP_API_KEY");
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass || !env.smtp.from) {
    missing.push("SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM");
  }
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Missing environment variables: ${missing.join(
        ", ",
      )}. Some features may not work.`,
    );
  }
}
