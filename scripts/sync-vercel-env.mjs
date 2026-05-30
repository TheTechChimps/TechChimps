import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const projectName = process.env.VERCEL_PROJECT_NAME || "techchimps";
const environments = (process.env.VERCEL_ENVIRONMENTS || "production").split(",").map((value) => value.trim()).filter(Boolean);
const keysToSync = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "QUOTE_WEBHOOK_URL",
  "STUDIO_NOTIFICATION_WEBHOOK_URL",
  "CRM_API_URL",
  "EMAIL_AUTOMATION_WEBHOOK_URL",
  "BLOB_READ_WRITE_TOKEN",
  "VERCEL_DEPLOY_HOOK_URL",
  "AUTOMATION_WEBHOOK_TOKEN",
  "EMAIL_FROM",
  "ADMIN_PASSWORD",
  "ADMIN_EMAIL",
  "ADMIN_NAME",
  "ADMIN_USERS_JSON",
  "ADMIN_SESSION_SECRET"
];

main();

function main() {
  const env = readEnv(envPath);

  if (!env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is required in .env.local to sync Vercel environment variables.");
  }

  for (const environment of environments) {
    for (const key of keysToSync) {
      const value = env[key];
      if (!value) continue;

      runVercel(["env", "rm", key, environment, "--yes"], env, { allowFailure: true });
      runVercel(["env", "add", key, environment], env, { input: `${value}\n` });
      console.log(`Synced ${key} to Vercel ${environment}.`);
    }
  }
}

function runVercel(args, envFile, options = {}) {
  const env = { ...process.env, ...envFile };
  const commandArgs = ["npx.cmd", "--yes", "vercel@latest", ...args];

  if (env.VERCEL_SCOPE && !args.includes("--scope") && !args.includes("-S")) {
    commandArgs.push("--scope", env.VERCEL_SCOPE);
  }

  if (projectName && args[0] !== "env") {
    commandArgs.push("--project", projectName);
  }

  env.TECHCHIMPS_VERCEL_TOKEN = env.VERCEL_TOKEN;
  commandArgs.push("--token", "%TECHCHIMPS_VERCEL_TOKEN%");

  const result = spawnSync("cmd.exe", ["/d", "/c", commandArgs.map(quoteCmdArg).join(" ")], {
    cwd: root,
    encoding: "utf8",
    env,
    input: options.input,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000
  });

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(result.stderr || result.stdout || `Vercel command failed: ${args.join(" ")}`);
  }

  return result;
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }

  return env;
}

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}
