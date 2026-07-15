// Uploads dist/ to the web host over FTP(S).
// Credentials live in .env.deploy (git-ignored) — see .env.deploy.example.
// Usage: npm run deploy   (builds first, then runs this script)
import { Client } from "basic-ftp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, "..", ".env.deploy");
const distPath = path.join(root, "..", "dist");

if (!existsSync(envPath)) {
  console.error(
    "Missing .env.deploy — copy .env.deploy.example to .env.deploy and fill it in.",
  );
  process.exit(1);
}
process.loadEnvFile(envPath);

const { FTP_HOST, FTP_USER, FTP_REMOTE_DIR } = process.env;
const secure = process.env.FTP_SECURE !== "false"; // FTPS by default

// Prefer a real environment variable for the password (FTP_PASSWORD_ENV names it).
// This avoids .env parsing pitfalls with special characters (#, quotes, spaces).
const passwordEnv = process.env.FTP_PASSWORD_ENV;
const FTP_PASSWORD = passwordEnv ? process.env[passwordEnv] : process.env.FTP_PASSWORD;
if (passwordEnv && !FTP_PASSWORD) {
  console.error(`FTP_PASSWORD_ENV points at "${passwordEnv}" but that variable is not set.`);
  process.exit(1);
}

for (const [name, value] of Object.entries({ FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR })) {
  if (!value) {
    console.error(`Missing ${name} in .env.deploy`);
    process.exit(1);
  }
}
// The remote dir gets cleared before upload; refuse anything that could be a site root.
if (FTP_REMOTE_DIR.replace(/[\\/]/g, "") === "") {
  console.error("FTP_REMOTE_DIR must be a subdirectory (e.g. /slowbend), not the root.");
  process.exit(1);
}
if (!existsSync(path.join(distPath, "index.html"))) {
  console.error("dist/index.html not found — run the build first (npm run deploy does this).");
  process.exit(1);
}

const client = new Client(30_000);
try {
  console.log(`Connecting to ${FTP_HOST} as ${FTP_USER} (${secure ? "FTPS" : "plain FTP"})...`);
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure,
  });
  await client.ensureDir(FTP_REMOTE_DIR); // also cds into it
  console.log(`Clearing ${FTP_REMOTE_DIR} and uploading dist/ ...`);
  await client.clearWorkingDir();
  await client.uploadFromDir(distPath);
  console.log(`Done — live at https://hildner.org${FTP_REMOTE_DIR.replace(/\/?$/, "/")}`);
} catch (err) {
  console.error("Deploy failed:", err.message ?? err);
  process.exitCode = 1;
} finally {
  client.close();
}
