import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = readEnv(path.join(root, ".env.local"));
const siteId = env.NETLIFY_SITE_ID || readLinkedSite();

if (!siteId) {
  throw new Error("Missing NETLIFY_SITE_ID. Link the Netlify site or set NETLIFY_SITE_ID in .env.local first.");
}

const build = runNetlify(["build", "--context", "production"], {
  allowFailure: true
});
const buildOutput = `${build.stdout}\n${build.stderr}`;

if (build.status !== 0 && !buildOutput.includes("Failed publishing static content")) {
  process.stdout.write(build.stdout ?? "");
  process.stderr.write(build.stderr ?? "");
  throw new Error("Netlify build failed before deploy output was generated.");
}

const staticDir = path.join(root, ".netlify", "static");
const functionsDir = path.join(root, ".netlify", "functions-internal");

if (!fs.existsSync(staticDir) || !fs.existsSync(functionsDir)) {
  throw new Error("Netlify build output is missing. Expected .netlify/static and .netlify/functions-internal.");
}

runNetlify(["deploy", "--prod", "--no-build", "--dir", staticDir, "--functions", functionsDir, "--site", siteId], {
  allowFailure: false,
  inherit: true
});

function runNetlify(args, options = {}) {
  const result = spawnSync("cmd.exe", ["/d", "/c", "npx.cmd", "--yes", "netlify-cli@latest", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: options.inherit ? "inherit" : "pipe"
  });

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`Netlify ${args[0]} failed.`);
  }

  return result;
}

function readLinkedSite() {
  try {
    const state = JSON.parse(fs.readFileSync(path.join(root, ".netlify", "state.json"), "utf8"));
    return state.siteId || "";
  } catch {
    return "";
  }
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const values = {};

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }

  return values;
}
