import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const projectName = process.env.VERCEL_PROJECT_NAME || "techchimps";
const domain = process.env.TECHCHIMPS_DOMAIN || "techchimps.com";
const vercelApexIp = "76.76.21.21";
const vercelWwwCname = "cname.vercel-dns-0.com";
const stripeApiVersion = "2026-04-22.dahlia";
const requiredStripeEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const env = readEnv(envPath);

  ensureVercelAuth(env);
  ensureVercelProject(env);
  pullVercelEnv(env, "production");

  env.NEXT_PUBLIC_SITE_URL = `https://${domain}`;
  env.NEXT_PUBLIC_CONTACT_EMAIL = "techchimps@proton.me";
  env.EMAIL_FROM = "techchimps@proton.me";

  writeEnv(envPath, env);
  console.log("Local .env.local updated for Vercel.");

  await ensureVercelBlob(env);
  pullVercelEnv(env, "production");

  if (env.STRIPE_SECRET_KEY) {
    const webhookSecret = await ensureStripeWebhook(env.STRIPE_SECRET_KEY, env.NEXT_PUBLIC_SITE_URL, env.STRIPE_WEBHOOK_SECRET);
    if (webhookSecret) env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  } else {
    console.log("Stripe webhook skipped because STRIPE_SECRET_KEY is missing.");
  }

  writeEnv(envPath, env);
  syncVercelEnv(env);
  ensureVercelDomains(env);

  if (hasNamecheapCredentials(env)) {
    await configureNamecheapDns(env);
  } else {
    printNamecheapInstructions();
  }

  console.log("");
  console.log("Vercel setup complete.");
  console.log(`Project: ${projectName}`);
  console.log(`Primary URL: https://${domain}`);
  console.log(`Storage: ${env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob token configured" : "Vercel Blob token still needed"}`);
  console.log("Deploy with: npm run deploy:vercel");
}

function pullVercelEnv(env, environment) {
  if (!env.VERCEL_TOKEN) return;

  const tempEnvPath = `.env.vercel-${environment}.pull`;
  if (fs.existsSync(tempEnvPath)) fs.unlinkSync(tempEnvPath);

  const result = runVercel(["env", "pull", tempEnvPath, "--environment", environment, "--yes"], {
    allowFailure: true,
    env,
    label: `Pulling Vercel ${environment} env`,
    timeout: 120_000
  });

  if (result.status !== 0 || !fs.existsSync(tempEnvPath)) return;

  const pulled = readEnv(tempEnvPath);
  fs.unlinkSync(tempEnvPath);

  for (const [key, value] of Object.entries(pulled)) {
    if (value) env[key] = value;
  }
}

function ensureVercelAuth(env) {
  const result = runVercel(["whoami"], { allowFailure: true, env, timeout: 120_000 });

  if (result.status === 0) return;

  throw new Error(
    "Vercel is not authenticated. Run `npx vercel login` once, or add VERCEL_TOKEN to .env.local, then rerun `npm run setup:vercel`."
  );
}

function ensureVercelProject(env) {
  const args = ["link", "--yes", "--project", projectName];
  if (env.VERCEL_SCOPE) args.push("--scope", env.VERCEL_SCOPE);

  const firstAttempt = runVercel(args, {
    allowFailure: true,
    env,
    label: "Linking Vercel project",
    timeout: 180_000
  });

  if (firstAttempt.status === 0) return;

  const detectedScope = env.VERCEL_SCOPE || detectVercelScope(firstAttempt);
  if (!detectedScope) {
    throw new Error(firstAttempt.stderr || firstAttempt.stdout || "Vercel project link failed.");
  }

  env.VERCEL_SCOPE = detectedScope;
  writeEnv(envPath, env);

  runVercel(["link", "--yes", "--project", projectName, "--scope", detectedScope], {
    env,
    label: "Linking Vercel project with detected scope",
    timeout: 180_000
  });
}

async function ensureVercelBlob(env) {
  if (env.BLOB_READ_WRITE_TOKEN) return;

  const beforeCreateEnv = { ...env };
  const connected = runVercel(
    [
      "blob",
      "create-store",
      "techchimps-data-main",
      "--access",
      "private",
      "--yes",
      "--environment",
      "production",
      "--environment",
      "preview",
      "--environment",
      "development"
    ],
    {
      allowFailure: true,
      env,
      label: "Creating and linking Vercel Blob store",
      timeout: 180_000
    }
  );

  if (connected.status === 0) {
    const updatedLocalEnv = readEnv(envPath);
    Object.assign(env, beforeCreateEnv, updatedLocalEnv);
    writeEnv(envPath, env);

    if (env.BLOB_READ_WRITE_TOKEN) {
      console.log("Vercel Blob token captured from linked store.");
      return;
    }
  }

  console.log("Vercel Blob store may need to be connected in the Vercel dashboard.");
  console.log("After creating/connecting it, add BLOB_READ_WRITE_TOKEN to .env.local and rerun setup.");
}

async function ensureStripeWebhook(secretKey, siteUrl, existingSecret) {
  if (existingSecret) return existingSecret;
  if (!siteUrl.startsWith("https://")) return "";

  const stripe = new Stripe(secretKey, { apiVersion: stripeApiVersion });
  const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/stripe/webhook`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((endpoint) => endpoint.url === webhookUrl && endpoint.status === "enabled");

  if (existing) {
    console.log("Stripe webhook endpoint already exists, but Stripe does not reveal existing signing secrets.");
    console.log("Creating a fresh TechChimps endpoint so .env.local can store the new signing secret.");
  }

  const endpoint = await stripe.webhookEndpoints.create({
    description: "TechChimps Checkout automation",
    enabled_events: requiredStripeEvents,
    metadata: {
      app: "techchimps",
      host: "vercel"
    },
    url: webhookUrl
  });

  console.log(`Stripe webhook ready: ${webhookUrl}`);
  return endpoint.secret || "";
}

function syncVercelEnv(env) {
  const keys = [
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

  for (const key of keys) {
    const value = env[key];
    if (!value) continue;

    runVercel(["env", "rm", key, "production", "--yes"], {
      allowFailure: true,
      env,
      timeout: 60_000
    });

    const result = runVercel(["env", "add", key, "production"], {
      allowFailure: true,
      env,
      input: `${value}\n`,
      timeout: 60_000
    });

    if (result.status === 0) {
      console.log(`Vercel env ${key} synced.`);
    } else {
      console.log(`Vercel env ${key} still needs manual update.`);
    }
  }
}

function ensureVercelDomains(env) {
  runVercel(["domains", "add", domain, projectName], {
    allowFailure: true,
    env,
    label: `Adding ${domain}`,
    timeout: 120_000
  });

  runVercel(["domains", "add", `www.${domain}`, projectName], {
    allowFailure: true,
    env,
    label: `Adding www.${domain}`,
    timeout: 120_000
  });

  const inspect = runVercel(["domains", "inspect", domain], {
    allowFailure: true,
    env,
    timeout: 60_000
  });

  if (inspect.stdout?.trim()) {
    console.log(inspect.stdout.trim());
  }
}

async function configureNamecheapDns(env) {
  const records = await getNamecheapHosts(env);
  const nextRecords = records.filter((record) => !isWebHostRecord(record));

  nextRecords.push({
    Address: vercelApexIp,
    Name: "@",
    TTL: "1800",
    Type: "A"
  });
  nextRecords.push({
    Address: vercelWwwCname,
    Name: "www",
    TTL: "1800",
    Type: "CNAME"
  });

  const response = await namecheapRequest(env, "namecheap.domains.dns.setHosts", buildHostParams(nextRecords), "POST");
  if (!/Status="OK"/i.test(response) || !/IsSuccess="true"/i.test(response)) {
    throw new Error(`Namecheap DNS update failed: ${extractNamecheapErrors(response) || "unknown error"}`);
  }

  console.log("Namecheap DNS updated for Vercel.");
}

async function getNamecheapHosts(env) {
  const response = await namecheapRequest(env, "namecheap.domains.dns.getHosts");
  if (!/Status="OK"/i.test(response)) {
    throw new Error(`Could not read Namecheap DNS records: ${extractNamecheapErrors(response) || "unknown error"}`);
  }

  return [...response.matchAll(/<Host\b([^>]*)\/>/g)].map((match) => parseXmlAttributes(match[1]));
}

function hasNamecheapCredentials(env) {
  return Boolean(env.NAMECHEAP_API_USER && env.NAMECHEAP_API_KEY && env.NAMECHEAP_USERNAME && env.NAMECHEAP_CLIENT_IP);
}

async function namecheapRequest(env, command, extraParams = {}, method = "GET") {
  const { sld, tld } = splitDomain(domain);
  const params = new URLSearchParams({
    ApiKey: env.NAMECHEAP_API_KEY,
    ApiUser: env.NAMECHEAP_API_USER,
    ClientIp: env.NAMECHEAP_CLIENT_IP,
    Command: command,
    SLD: sld,
    TLD: tld,
    UserName: env.NAMECHEAP_USERNAME,
    ...extraParams
  });

  const baseUrl =
    env.NAMECHEAP_SANDBOX === "true"
      ? "https://api.sandbox.namecheap.com/xml.response"
      : "https://api.namecheap.com/xml.response";

  const response =
    method === "POST"
      ? await fetch(baseUrl, {
          body: params,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          method: "POST"
        })
      : await fetch(`${baseUrl}?${params}`);

  return response.text();
}

function buildHostParams(records) {
  const params = {};
  records.forEach((record, index) => {
    const id = index + 1;
    params[`Address${id}`] = record.Address;
    params[`HostName${id}`] = record.Name || "@";
    params[`RecordType${id}`] = record.Type;
    params[`TTL${id}`] = record.TTL || "1800";
    if (record.MXPref) params[`MXPref${id}`] = record.MXPref;
  });
  return params;
}

function printNamecheapInstructions() {
  console.log("");
  console.log("Namecheap API credentials were not found, so DNS was not changed automatically.");
  console.log("In Namecheap Advanced DNS, replace the website records with:");
  console.log(`A      @    ${vercelApexIp}`);
  console.log(`CNAME  www  ${vercelWwwCname}`);
  console.log("");
  console.log("To automate DNS, add NAMECHEAP_API_USER, NAMECHEAP_API_KEY, NAMECHEAP_USERNAME, and NAMECHEAP_CLIENT_IP to .env.local.");
}

function isWebHostRecord(record) {
  const name = String(record.Name || "").toLowerCase();
  const type = String(record.Type || "").toUpperCase();
  return (name === "@" || name === "www") && ["A", "AAAA", "ALIAS", "CNAME", "URL", "URL301", "FRAME"].includes(type);
}

function runVercel(args, options = {}) {
  const env = { ...process.env, ...(options.env || {}) };
  const commandArgs = ["npx.cmd", "--yes", "vercel@latest", ...args];

  if (env.VERCEL_SCOPE && !args.includes("--scope") && !args.includes("-S")) {
    commandArgs.push("--scope", env.VERCEL_SCOPE);
  }

  if (env.VERCEL_TOKEN) {
    env.TECHCHIMPS_VERCEL_TOKEN = env.VERCEL_TOKEN;
    commandArgs.push("--token", "%TECHCHIMPS_VERCEL_TOKEN%");
  }

  const result = spawnSync("cmd.exe", ["/d", "/c", commandArgs.map(quoteCmdArg).join(" ")], {
    cwd: root,
    encoding: "utf8",
    env,
    input: options.input,
    maxBuffer: 32 * 1024 * 1024,
    timeout: options.timeout || 120_000
  });

  if (result.status !== 0 && !options.allowFailure) {
    const message = result.error?.message || result.stderr || result.stdout || `${options.label || "Vercel command"} failed.`;
    throw new Error(message);
  }

  return result;
}

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function detectVercelScope(result) {
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;

  try {
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
      const choice = parsed.choices?.[0]?.name || parsed.choices?.[0]?.id;
      if (choice) return choice;
    }
  } catch {
    // Fall through to text matching.
  }

  return output.match(/--scope\s+([^\s"]+)/)?.[1] || "";
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

function writeEnv(file, env) {
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
    "ADMIN_VAPID_SUBJECT",
    "NAMECHEAP_API_USER",
    "NAMECHEAP_API_KEY",
    "NAMECHEAP_USERNAME",
    "NAMECHEAP_CLIENT_IP",
    "NAMECHEAP_SANDBOX",
    "NETLIFY_SITE_ID",
    "NETLIFY_BLOBS_TOKEN",
    "NETLIFY_BUILD_HOOK_URL"
  ];
  const keys = [...new Set([...preferredKeys, ...Object.keys(env)])].filter((key) => env[key] !== undefined && env[key] !== "");
  const lines = keys.map((key) => `${key}=${env[key] || ""}`);
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function splitDomain(value) {
  const parts = value.split(".");
  if (parts.length < 2) throw new Error(`Invalid domain: ${value}`);
  return {
    sld: parts.slice(0, -1).join("."),
    tld: parts.at(-1)
  };
}

function parseXmlAttributes(value) {
  const attrs = {};
  for (const [, key, raw] of value.matchAll(/([A-Za-z]+)="([^"]*)"/g)) {
    attrs[key] = decodeXml(raw);
  }
  return attrs;
}

function extractNamecheapErrors(xml) {
  return [...xml.matchAll(/<Error[^>]*>([^<]+)<\/Error>/g)].map((match) => decodeXml(match[1])).join("; ");
}

function decodeXml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
