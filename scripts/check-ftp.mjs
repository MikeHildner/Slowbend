// Login-only FTP check: verifies credentials and lists the remote dir.
// Uploads nothing, changes nothing. Usage: npm run deploy:check
import { Client } from "basic-ftp";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, "..", ".env.deploy");

if (!existsSync(envPath)) {
  console.error("Missing .env.deploy — copy .env.deploy.example to .env.deploy and fill it in.");
  process.exit(1);
}
process.loadEnvFile(envPath);

const { FTP_HOST, FTP_USER, FTP_REMOTE_DIR } = process.env;
const secure = process.env.FTP_SECURE !== "false";
const passwordEnv = process.env.FTP_PASSWORD_ENV;
const password = passwordEnv ? process.env[passwordEnv] : process.env.FTP_PASSWORD;

console.log(`host: ${FTP_HOST}`);
console.log(`user: ${FTP_USER}`);
console.log(`remote dir: ${FTP_REMOTE_DIR}`);
console.log(`mode: ${secure ? "FTPS" : "plain FTP"}`);
console.log(
  `password source: ${passwordEnv ? `environment variable ${passwordEnv}` : ".env.deploy FTP_PASSWORD"}`,
);

// Diagnostic: if both sources exist, say whether .env parsing mangled the password
// (never prints either value).
const filePw = process.env.FTP_PASSWORD;
const envPw = passwordEnv ? process.env[passwordEnv] : undefined;
if (filePw && envPw) {
  if (filePw === envPw) {
    console.log("note: FTP_PASSWORD in .env.deploy matches the environment variable.");
  } else {
    console.log(
      `note: FTP_PASSWORD parsed from .env.deploy (${filePw.length} chars) DIFFERS from ` +
        `${passwordEnv} (${envPw.length} chars) — .env parsing likely mangled special characters.`,
    );
  }
}

if (!password) {
  console.error("No password available — set FTP_PASSWORD or FTP_PASSWORD_ENV in .env.deploy.");
  process.exit(1);
}

const client = new Client(30_000);
try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password, secure });
  console.log("Login OK.");
  await client.cd(FTP_REMOTE_DIR);
  const list = await client.list();
  console.log(`Remote dir exists with ${list.length} item(s):`);
  for (const item of list.slice(0, 20)) console.log(`  ${item.name}`);
} catch (err) {
  console.error("Check failed:", err.message ?? err);
  process.exitCode = 1;
} finally {
  client.close();
}
