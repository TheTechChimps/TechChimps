import fs from "node:fs";
import path from "node:path";
import webPush from "web-push";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

const env = readEnv(envPath);
const shouldRotate = process.argv.includes("--rotate");

if (!shouldRotate && env.NEXT_PUBLIC_ADMIN_VAPID_PUBLIC_KEY && env.ADMIN_VAPID_PRIVATE_KEY) {
  console.log("Admin push keys already exist in .env.local. Use --rotate to replace them.");
  console.log(`Public key: ${env.NEXT_PUBLIC_ADMIN_VAPID_PUBLIC_KEY}`);
  process.exit(0);
}

const keys = webPush.generateVAPIDKeys();

env.NEXT_PUBLIC_ADMIN_VAPID_PUBLIC_KEY = keys.publicKey;
env.ADMIN_VAPID_PUBLIC_KEY = keys.publicKey;
env.ADMIN_VAPID_PRIVATE_KEY = keys.privateKey;
env.ADMIN_VAPID_SUBJECT = env.ADMIN_VAPID_SUBJECT || `mailto:${env.NEXT_PUBLIC_CONTACT_EMAIL || "techchimps@proton.me"}`;

writeEnv(envPath, env);

console.log("Admin push keys saved to .env.local.");
console.log(`Public key: ${keys.publicKey}`);
console.log("Private key saved locally and intentionally not printed.");

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const envFile = {};

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    envFile[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }

  return envFile;
}

function writeEnv(file, envFile) {
  const preferredKeys = [
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
    "VERCEL_TOKEN",
    "VERCEL_SCOPE",
    "CRON_SECRET",
    "EMAIL_FROM",
    "ADMIN_PASSWORD",
    "ADMIN_EMAIL",
    "ADMIN_NAME",
    "ADMIN_USERS_JSON",
    "ADMIN_SESSION_SECRET",
    "NEXT_PUBLIC_ADMIN_VAPID_PUBLIC_KEY",
    "ADMIN_VAPID_PUBLIC_KEY",
    "ADMIN_VAPID_PRIVATE_KEY",
    "ADMIN_VAPID_SUBJECT"
  ];
  const keys = [...new Set([...preferredKeys, ...Object.keys(envFile)])].filter((key) => envFile[key] !== undefined && envFile[key] !== "");
  fs.writeFileSync(file, `${keys.map((key) => `${key}=${envFile[key]}`).join("\n")}\n`);
}
