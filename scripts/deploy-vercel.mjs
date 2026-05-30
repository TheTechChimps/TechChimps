import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const env = { ...process.env, ...readEnv(envPath) };

main();

function main() {
  run("npm.cmd", ["run", "typecheck"], { inherit: true, timeout: 120_000 });
  run("npm.cmd", ["run", "lint"], { inherit: true, timeout: 120_000 });
  run("npm.cmd", ["run", "build"], { inherit: true, timeout: 180_000 });

  const deployment = runVercel(["deploy", "--prod", "--yes"], {
    timeout: 600_000
  });

  const deploymentUrl = deployment.stdout.trim().split(/\r?\n/).at(-1) || "";
  if (deploymentUrl) {
    console.log("");
    console.log(`Vercel production deployment: ${deploymentUrl}`);
  }
}

function run(command, args, options = {}) {
  const executable = command.endsWith(".cmd") ? "cmd.exe" : command;
  const executableArgs = command.endsWith(".cmd") ? ["/d", "/c", [command, ...args.map(quoteCmdArg)].join(" ")] : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    encoding: "utf8",
    env,
    maxBuffer: 32 * 1024 * 1024,
    stdio: options.inherit ? "inherit" : "pipe",
    timeout: options.timeout || 120_000
  });

  if (result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || `${command} failed.`);
  }

  return result;
}

function runVercel(args, options = {}) {
  const commandArgs = ["--yes", "vercel@latest", ...args];

  if (env.VERCEL_SCOPE && !args.includes("--scope") && !args.includes("-S")) {
    commandArgs.push("--scope", env.VERCEL_SCOPE);
  }

  if (env.VERCEL_TOKEN) {
    env.TECHCHIMPS_VERCEL_TOKEN = env.VERCEL_TOKEN;
    commandArgs.push("--token", "%TECHCHIMPS_VERCEL_TOKEN%");
  }

  const result = run("npx.cmd", commandArgs, {
    timeout: options.timeout || 600_000
  });

  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  if (result.stdout?.trim()) process.stdout.write(`${result.stdout.trim()}\n`);

  return result;
}

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
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
