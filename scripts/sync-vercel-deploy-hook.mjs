import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const projectName = process.env.VERCEL_PROJECT_NAME || "techchimps";
const hookName = process.env.VERCEL_DEPLOY_HOOK_NAME || "techchimps-self-heal";
const branch = process.env.VERCEL_DEPLOY_BRANCH || "main";

main();

function main() {
  const env = readEnv(envPath);

  if (!env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is required in .env.local before a Vercel deploy hook can be synced.");
  }

  const existing = listDeployHooks(env).find((hook) => hook.name === hookName || hook.ref === branch);

  if (existing?.url) {
    saveHookUrl(env, existing.url);
    console.log("Vercel deploy hook already exists and is saved locally.");
    syncVercelEnv(env);
    return;
  }

  const created = createDeployHook(env);

  if (!created?.url) {
    console.log("Vercel deploy hook could not be created automatically.");
    console.log("Connect the Vercel project to a Git repository, then rerun: npm run sync:vercel-deploy-hook");
    return;
  }

  saveHookUrl(env, created.url);
  console.log("Vercel deploy hook created and saved locally.");
  syncVercelEnv(env);
}

function listDeployHooks(env) {
  const result = runVercel(["deploy-hooks", "list", "--format", "json", "--project", projectName], env, {
    allowFailure: true
  });

  if (result.status !== 0) return [];

  try {
    const parsed = JSON.parse(result.stdout);
    return Array.isArray(parsed.hooks) ? parsed.hooks : [];
  } catch {
    return [];
  }
}

function createDeployHook(env) {
  const result = runVercel(["deploy-hooks", "create", hookName, "--ref", branch, "--project", projectName], env, {
    allowFailure: true
  });

  if (result.status !== 0) {
    const output = `${result.stdout}\n${result.stderr}`;
    if (/not connected to a Git repository/i.test(output)) return null;
    throw new Error(output.trim() || "Vercel deploy hook creation failed.");
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return parsed.hook || parsed;
  } catch {
    const url = result.stdout.match(/https:\/\/api\.vercel\.com\/v1\/integrations\/deploy\/[^\s"']+/)?.[0];
    return url ? { url } : null;
  }
}

function saveHookUrl(env, url) {
  env.VERCEL_DEPLOY_HOOK_URL = url;
  writeEnv(envPath, env);
}

function syncVercelEnv(env) {
  runVercel(["env", "rm", "VERCEL_DEPLOY_HOOK_URL", "production", "--yes"], env, {
    allowFailure: true
  });
  const result = runVercel(["env", "add", "VERCEL_DEPLOY_HOOK_URL", "production"], env, {
    allowFailure: true,
    input: `${env.VERCEL_DEPLOY_HOOK_URL}\n`
  });

  if (result.status === 0) {
    console.log("VERCEL_DEPLOY_HOOK_URL synced to Vercel production.");
  } else {
    console.log("VERCEL_DEPLOY_HOOK_URL still needs manual sync in Vercel.");
  }
}

function runVercel(args, envFile, options = {}) {
  const env = { ...process.env, ...envFile };
  env.TECHCHIMPS_VERCEL_TOKEN = env.VERCEL_TOKEN;

  const commandArgs = ["npx.cmd", "--yes", "vercel@latest", ...args];
  if (env.VERCEL_SCOPE && !args.includes("--scope") && !args.includes("-S")) {
    commandArgs.push("--scope", env.VERCEL_SCOPE);
  }
  commandArgs.push("--token", "%TECHCHIMPS_VERCEL_TOKEN%");

  const result = spawnSync("cmd.exe", ["/d", "/c", commandArgs.map(quoteCmdArg).join(" ")], {
    cwd: root,
    encoding: "utf8",
    env,
    input: options.input,
    maxBuffer: 8 * 1024 * 1024,
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

function writeEnv(file, env) {
  const existingOrder = fs.existsSync(file)
    ? fs
        .readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
        .filter(Boolean)
    : [];
  const keys = [...new Set([...existingOrder, "VERCEL_DEPLOY_HOOK_URL", ...Object.keys(env)])].filter((key) => env[key]);
  fs.writeFileSync(file, `${keys.map((key) => `${key}=${env[key]}`).join("\n")}\n`);
}

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}
