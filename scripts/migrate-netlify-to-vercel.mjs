import { getStore } from "@netlify/blobs";
import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = { ...process.env, ...readEnv(path.join(root, ".env.local")) };
const jsonStores = [
  "techchimps-orders",
  "techchimps-accounts",
  "techchimps-build-prompts",
  "techchimps-live-chat",
  "techchimps-upload-metadata"
];
const binaryStores = ["techchimps-upload-files"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const siteID = env.NETLIFY_SITE_ID;
  const netlifyToken = env.NETLIFY_BLOBS_TOKEN || env.NETLIFY_AUTH_TOKEN;
  const vercelToken = env.BLOB_READ_WRITE_TOKEN;

  if (!siteID || !netlifyToken) {
    throw new Error("Missing NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN/NETLIFY_AUTH_TOKEN for source storage.");
  }

  if (!vercelToken) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN for Vercel destination storage.");
  }

  let copied = 0;

  for (const storeName of jsonStores) {
    copied += await copyJsonStore(storeName, siteID, netlifyToken, vercelToken);
  }

  for (const storeName of binaryStores) {
    copied += await copyBinaryStore(storeName, siteID, netlifyToken, vercelToken);
  }

  console.log(`Storage migration complete. Copied ${copied} blobs to Vercel Blob.`);
}

async function copyJsonStore(storeName, siteID, netlifyToken, vercelToken) {
  const source = getStore({ consistency: "strong", name: storeName, siteID, token: netlifyToken });
  let copied = 0;

  for (const item of await listAll(source)) {
    const value = await source.get(item.key, { type: "json" }).catch(() => null);
    if (value === null || value === undefined) continue;

    await put(vercelPath(storeName, item.key), JSON.stringify(value), {
      access: "private",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
      token: vercelToken
    });
    copied += 1;
  }

  console.log(`${storeName}: copied ${copied}`);
  return copied;
}

async function copyBinaryStore(storeName, siteID, netlifyToken, vercelToken) {
  const source = getStore({ consistency: "strong", name: storeName, siteID, token: netlifyToken });
  let copied = 0;

  for (const item of await listAll(source)) {
    const value = await source.get(item.key, { type: "arrayBuffer" }).catch(() => null);
    if (!value) continue;

    await put(vercelPath(storeName, item.key), value, {
      access: "private",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/octet-stream",
      token: vercelToken
    });
    copied += 1;
  }

  console.log(`${storeName}: copied ${copied}`);
  return copied;
}

async function listAll(store) {
  const blobs = [];
  let cursor;

  do {
    const result = await store.list({ cursor });
    blobs.push(...result.blobs);
    cursor = result.cursor;
    if (!cursor) break;
  } while (cursor);

  return blobs;
}

function vercelPath(storeName, key) {
  return `${storeName}/${key}`.replace(/\/+/g, "/");
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
