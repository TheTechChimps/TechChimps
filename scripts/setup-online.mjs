import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const statePath = path.join(root, ".netlify", "state.json");
const siteNameCandidates = ["techchimps", "techchimps-digital-studio"];
const stripeApiVersion = "2026-04-22.dahlia";
const requiredStripeEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const env = readEnv(envPath);

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY in .env.local. Copy a valid account key before running setup.");
  }

  ensureNetlifyToml();
  const site = ensureNetlifySite(env);
  const siteUrl = normalizeHttps(site.ssl_url || site.url || `https://${site.name}.netlify.app`);
  env.NEXT_PUBLIC_SITE_URL = siteUrl;
  env.NETLIFY_SITE_ID = site.id || site.site_id;

  const buildHookUrl = ensureNetlifyBuildHook(env.NETLIFY_SITE_ID);
  if (buildHookUrl) env.NETLIFY_BUILD_HOOK_URL = buildHookUrl;

  const webhookSecret = await ensureStripeWebhook(env.STRIPE_SECRET_KEY, siteUrl, env.STRIPE_WEBHOOK_SECRET);
  if (webhookSecret) env.STRIPE_WEBHOOK_SECRET = webhookSecret;

  writeEnv(envPath, env);
  syncNetlifyEnv(env);

  console.log("TechChimps online setup complete.");
  console.log(`Netlify site: ${site.name}`);
  console.log(`Site URL: ${siteUrl}`);
  console.log(`Stripe webhook: ${env.STRIPE_WEBHOOK_SECRET ? "configured" : "needs attention"}`);
  console.log(`Netlify build hook: ${env.NETLIFY_BUILD_HOOK_URL ? "configured" : "needs attention"}`);
}

function ensureNetlifyToml() {
  const file = path.join(root, "netlify.toml");
  if (fs.existsSync(file)) return;

  fs.writeFileSync(
    file,
    `[build]\n  command = "npm run build"\n  publish = ".next"\n\n[build.environment]\n  NODE_VERSION = "22"\n  NETLIFY_NEXT_SKEW_PROTECTION = "true"\n\n[[plugins]]\n  package = "@netlify/plugin-nextjs"\n`
  );
}

function ensureNetlifySite(env) {
  const linked = readLinkedSite();
  if (linked) {
    const linkedSite = listNetlifySites().find((site) => (site.id || site.site_id) === linked);
    if (linkedSite) return linkedSite;

    return {
      id: linked,
      name: "techchimps",
      ssl_url: env.NEXT_PUBLIC_SITE_URL || "https://techchimps.netlify.app"
    };
  }

  const existing = listNetlifySites().find((site) => /techchimps|tech-chimps|techchimp/i.test(site.name));
  if (existing) {
    runNetlify(["link", "--id", existing.id || existing.site_id], { label: `Linking ${existing.name}` });
    return existing;
  }

  for (const name of [...siteNameCandidates, `techchimps-${Date.now().toString(36)}`]) {
    const created = runNetlify(["sites:create", "--name", name, "--json"], {
      allowFailure: true,
      label: `Creating Netlify site ${name}`
    });

    if (created.status === 0 && created.stdout.trim()) {
      return JSON.parse(created.stdout);
    }
  }

  throw new Error("Could not create a Netlify site non-interactively.");
}

function ensureNetlifyBuildHook(siteId) {
  if (!siteId) return "";
  const env = readEnv(envPath);
  if (env.NETLIFY_BUILD_HOOK_URL) return env.NETLIFY_BUILD_HOOK_URL;

  const hooks = netlifyApi("listSiteBuildHooks", { site_id: siteId }, { allowFailure: true }) ?? [];
  const existing = Array.isArray(hooks)
    ? hooks.find((hook) => String(hook.title || hook.name || "").toLowerCase().includes("techchimps"))
      ?? hooks.find((hook) => hook.url)
    : null;

  if (existing?.url) return existing.url;

  const createPayloads = [
    { site_id: siteId, build_hook: { title: "TechChimps self-heal deploy", branch: "main" } },
    { site_id: siteId, title: "TechChimps self-heal deploy", branch: "main" }
  ];

  for (const payload of createPayloads) {
    const created = netlifyApi("createSiteBuildHook", payload, { allowFailure: true });
    if (created?.url) return created.url;
  }

  return "";
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
      app: "techchimps"
    },
    url: webhookUrl
  });

  return endpoint.secret || "";
}

function syncNetlifyEnv(env) {
  const siteId = env.NETLIFY_SITE_ID;
  if (!siteId) return;

  const envKeys = [
    "NEXT_PUBLIC_SITE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NETLIFY_SITE_ID",
    "NETLIFY_BUILD_HOOK_URL",
    "QUOTE_WEBHOOK_URL",
    "STUDIO_NOTIFICATION_WEBHOOK_URL",
    "CRM_API_URL",
    "EMAIL_AUTOMATION_WEBHOOK_URL",
    "EMAIL_FROM",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET"
  ];

  for (const key of envKeys) {
    const value = env[key];
    if (!value) continue;

    runNetlifyEnvSet(siteId, key, value, isSecretKey(key));
  }
}

function listNetlifySites() {
  const result = runNetlify(["sites:list", "--json"], { label: "Listing Netlify sites" });
  return JSON.parse(result.stdout || "[]");
}

function netlifyApi(method, data, options = {}) {
  const result = runNetlify(["api", method, "--data", JSON.stringify(data)], {
    allowFailure: options.allowFailure,
    label: `Netlify API ${method}`
  });

  if (result.status !== 0) return null;
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : null;
}

function runNetlifyEnvSet(siteId, key, value, secret) {
  const env = { ...process.env, TECHCHIMPS_NETLIFY_VALUE: value };
  const args = [
    "--yes",
    "netlify-cli@latest",
    "env:set",
    key,
    "%TECHCHIMPS_NETLIFY_VALUE%",
    "--context",
    "production",
    "--site",
    siteId,
    "--force"
  ];

  if (secret) args.push("--secret");

  const command = ["npx.cmd", ...args.map((arg) => (arg === "%TECHCHIMPS_NETLIFY_VALUE%" ? arg : quoteCmdArg(arg)))].join(" ");
  const result = spawnSync("cmd.exe", ["/d", "/c", command], {
    cwd: root,
    encoding: "utf8",
    env,
    maxBuffer: 16 * 1024 * 1024
  });

  if (result.status !== 0) {
    console.warn(`Could not sync ${key} to Netlify.`);
  }
}

function runNetlify(args, options = {}) {
  const commandArgs = ["--yes", "netlify-cli@latest", ...args];
  const result = spawnSync("cmd.exe", ["/d", "/c", ["npx.cmd", ...commandArgs.map(quoteCmdArg)].join(" ")], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${options.label || "Netlify command"} failed: ${result.error?.message || result.stderr || result.stdout}`);
  }

  return result;
}

function readLinkedSite() {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return state.siteId || "";
  } catch {
    return "";
  }
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
  const keys = [
    "NEXT_PUBLIC_SITE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "QUOTE_WEBHOOK_URL",
    "STUDIO_NOTIFICATION_WEBHOOK_URL",
    "CRM_API_URL",
    "EMAIL_AUTOMATION_WEBHOOK_URL",
    "NETLIFY_SITE_ID",
    "NETLIFY_BLOBS_TOKEN",
    "NETLIFY_BUILD_HOOK_URL",
    "EMAIL_FROM",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET"
  ];

  const lines = keys.map((key) => `${key}=${env[key] || ""}`);
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function normalizeHttps(url) {
  const value = String(url || "").replace(/\/$/, "");
  return value.startsWith("http://") ? value.replace("http://", "https://") : value;
}

function isSecretKey(key) {
  return /SECRET|TOKEN|WEBHOOK|KEY/i.test(key) && !key.startsWith("NEXT_PUBLIC_");
}

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^%]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}
