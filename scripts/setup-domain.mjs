import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const statePath = path.join(root, ".netlify", "state.json");
const domain = process.env.TECHCHIMPS_DOMAIN || "techchimps.com";
const netlifySubdomain = process.env.TECHCHIMPS_NETLIFY_SUBDOMAIN || "techchimps.netlify.app";
const netlifyApexAlias = "apex-loadbalancer.netlify.com";
const netlifyApexIp = "75.2.60.5";

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const env = readEnv(envPath);
  const siteId = env.NETLIFY_SITE_ID || readLinkedSite();

  if (!siteId) {
    throw new Error("Missing NETLIFY_SITE_ID. Link the Netlify site or set NETLIFY_SITE_ID in .env.local first.");
  }

  console.log(`Setting TechChimps domain to https://${domain}`);
  await updateNetlifySite(siteId);
  updateLocalEnv(env);
  setNetlifyEnv(siteId, "NEXT_PUBLIC_SITE_URL", `https://${domain}`);
  setNetlifyEnv(siteId, "NEXT_PUBLIC_CONTACT_EMAIL", "techchimps@proton.me");
  setNetlifyEnv(siteId, "EMAIL_FROM", "techchimps@proton.me");

  if (hasNamecheapCredentials(env)) {
    await configureNamecheapDns(env);
  } else {
    printNamecheapInstructions();
  }

  await tryProvisionCertificate(siteId);
  printDnsStatus();
}

async function updateNetlifySite(siteId) {
  const token = readNetlifyToken();
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      custom_domain: domain,
      domain_aliases: [`www.${domain}`]
    })
  });

  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(`Netlify domain update failed: ${body.message || body.error || response.statusText}`);
  }

  console.log(`Netlify domain attached: ${body.custom_domain}`);
}

function updateLocalEnv(env) {
  env.NEXT_PUBLIC_SITE_URL = `https://${domain}`;
  env.NEXT_PUBLIC_CONTACT_EMAIL = "techchimps@proton.me";
  env.EMAIL_FROM = "techchimps@proton.me";
  writeEnv(envPath, env);
  console.log("Local .env.local domain values updated.");
}

async function configureNamecheapDns(env) {
  const records = await getNamecheapHosts(env);
  const nextRecords = records.filter((record) => !isWebHostRecord(record));

  nextRecords.push({
    Name: "@",
    Type: "ALIAS",
    Address: netlifyApexAlias,
    TTL: "1800"
  });
  nextRecords.push({
    Name: "www",
    Type: "CNAME",
    Address: netlifySubdomain,
    TTL: "1800"
  });

  const response = await namecheapRequest(env, "namecheap.domains.dns.setHosts", buildHostParams(nextRecords), "POST");
  if (!/Status="OK"/i.test(response) || !/IsSuccess="true"/i.test(response)) {
    throw new Error(`Namecheap DNS update failed: ${extractNamecheapErrors(response) || "unknown error"}`);
  }

  console.log("Namecheap DNS updated: apex ALIAS and www CNAME now point to Netlify.");
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
    ApiUser: env.NAMECHEAP_API_USER,
    ApiKey: env.NAMECHEAP_API_KEY,
    UserName: env.NAMECHEAP_USERNAME,
    ClientIp: env.NAMECHEAP_CLIENT_IP,
    Command: command,
    SLD: sld,
    TLD: tld,
    ...extraParams
  });

  const baseUrl =
    env.NAMECHEAP_SANDBOX === "true"
      ? "https://api.sandbox.namecheap.com/xml.response"
      : "https://api.namecheap.com/xml.response";

  const response =
    method === "POST"
      ? await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params
        })
      : await fetch(`${baseUrl}?${params}`);

  return response.text();
}

function buildHostParams(records) {
  const params = {};
  records.forEach((record, index) => {
    const id = index + 1;
    params[`HostName${id}`] = record.Name || "@";
    params[`RecordType${id}`] = record.Type;
    params[`Address${id}`] = record.Address;
    params[`TTL${id}`] = record.TTL || "1800";
    if (record.MXPref) params[`MXPref${id}`] = record.MXPref;
  });
  return params;
}

function isWebHostRecord(record) {
  const name = String(record.Name || "").toLowerCase();
  const type = String(record.Type || "").toUpperCase();
  return (name === "@" || name === "www") && ["A", "AAAA", "ALIAS", "CNAME", "URL", "URL301", "FRAME"].includes(type);
}

async function tryProvisionCertificate(siteId) {
  const token = readNetlifyToken();
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/ssl`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await readJson(response);
  if (!response.ok) {
    console.log(`TLS pending: ${body.message || body.error || "DNS needs to point to Netlify first."}`);
    return;
  }

  console.log(`TLS certificate state: ${body?.state || "requested"}`);

  await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ force_ssl: true })
  });
}

function setNetlifyEnv(siteId, key, value) {
  const result = spawnSync(
    "cmd.exe",
    [
      "/d",
      "/c",
      [
        "npx.cmd",
        "--yes",
        "netlify-cli@latest",
        "env:set",
        key,
        value,
        "--context",
        "production",
        "--site",
        siteId,
        "--force"
      ]
        .map(quoteCmdArg)
        .join(" ")
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );

  if (result.status !== 0) {
    console.log(`Netlify env ${key} still needs manual update.`);
    return;
  }

  console.log(`Netlify env ${key} updated.`);
}

function printNamecheapInstructions() {
  console.log("");
  console.log("Namecheap API credentials were not found, so DNS was not changed automatically.");
  console.log("Add these Namecheap Advanced DNS records:");
  console.log(`ALIAS  @    ${netlifyApexAlias}`);
  console.log(`CNAME  www  ${netlifySubdomain}`);
  console.log(`Fallback if ALIAS is unavailable: A  @  ${netlifyApexIp}`);
  console.log("");
  console.log("To automate Namecheap next time, set NAMECHEAP_API_USER, NAMECHEAP_API_KEY, NAMECHEAP_USERNAME, and NAMECHEAP_CLIENT_IP in .env.local.");
}

function printDnsStatus() {
  console.log("");
  console.log("After DNS propagates, run: npm run domain:setup");
  console.log("The second run will retry TLS and HTTPS enforcement.");
}

function readNetlifyToken() {
  const configPath = path.join(process.env.APPDATA || "", "netlify", "Config", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const userId = config.userId || Object.keys(config.users || {})[0];
  const auth = config.users?.[userId]?.auth || {};
  const token = auth.token || auth.access_token || auth.accessToken || auth.oauth_token;

  if (!token) {
    throw new Error("No Netlify auth token found. Run `npx netlify login` first.");
  }

  return token;
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
  const existingKeys = Object.keys(env);
  const preferredKeys = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_CONTACT_EMAIL",
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
    "NAMECHEAP_API_USER",
    "NAMECHEAP_API_KEY",
    "NAMECHEAP_USERNAME",
    "NAMECHEAP_CLIENT_IP",
    "NAMECHEAP_SANDBOX"
  ];
  const keys = [...new Set([...preferredKeys, ...existingKeys])];
  const lines = keys.filter((key) => env[key] !== undefined).map((key) => `${key}=${env[key]}`);
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

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
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

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^%]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}
