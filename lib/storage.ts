import { getStore } from "@netlify/blobs";
import { del as deleteVercelBlob, get as getVercelBlob, list as listVercelBlobs, put as putVercelBlob } from "@vercel/blob";

type MemoryStores = Record<string, Record<string, unknown>>;
type BlobInput = string | ArrayBuffer | Blob;
type MemoryBlobRecord = {
  body: ArrayBuffer;
  contentType?: string;
  metadata?: Record<string, unknown>;
  storedAt: string;
  type: string;
};
const INDEX_KEY = "__keys";

const memoryRoot = globalThis as typeof globalThis & {
  techChimpsMemoryStores?: MemoryStores;
};

function getMemoryStore(name: string) {
  if (!memoryRoot.techChimpsMemoryStores) memoryRoot.techChimpsMemoryStores = {};
  if (!memoryRoot.techChimpsMemoryStores[name]) memoryRoot.techChimpsMemoryStores[name] = {};
  return memoryRoot.techChimpsMemoryStores[name];
}

function getVercelBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN || "";
}

function vercelPath(storeName: string, key: string) {
  return `${storeName}/${key}`.replace(/\/+/g, "/");
}

function getBlobStore(name: string) {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;

  if (siteID && token) {
    try {
      return getStore({ consistency: "strong", name, siteID, token });
    } catch {
      return null;
    }
  }

  try {
    return getStore({ consistency: "strong", name });
  } catch {
    return null;
  }
}

export function getStorageMode() {
  if (getVercelBlobToken()) return "vercel-blob";
  return getBlobStore("techchimps-health") ? "netlify-blobs" : "memory";
}

export async function readJson<T>(storeName: string, key: string): Promise<T | null> {
  const vercelToken = getVercelBlobToken();

  if (vercelToken) {
    return readVercelJson<T>(storeName, key, vercelToken);
  }

  const blobStore = getBlobStore(storeName);

  if (blobStore) {
    try {
      const value = (await blobStore.get(key, { type: "json" })) as T | null;
      return value ?? null;
    } catch {
      return null;
    }
  }

  return (getMemoryStore(storeName)[key] as T | undefined) ?? null;
}

export async function writeJson<T>(storeName: string, key: string, value: T) {
  const vercelToken = getVercelBlobToken();

  if (vercelToken) {
    await writeVercelJson(storeName, key, value, vercelToken);
    await updateKeyIndex(storeName, key, value === null);
    return;
  }

  const blobStore = getBlobStore(storeName);

  if (blobStore) {
    await blobStore.setJSON(key, value);
    await updateKeyIndex(storeName, key, value === null);
    return;
  }

  const memoryStore = getMemoryStore(storeName);
  if (value === null) {
    delete memoryStore[key];
  } else {
    memoryStore[key] = value;
  }
  await updateKeyIndex(storeName, key, value === null);
}

export async function writeBlob(storeName: string, key: string, value: BlobInput, metadata?: Record<string, unknown>) {
  const vercelToken = getVercelBlobToken();

  if (vercelToken) {
    await putVercelBlob(vercelPath(storeName, key), value, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: typeof metadata?.type === "string" ? metadata.type : undefined,
      token: vercelToken
    });
    return;
  }

  const blobStore = getBlobStore(storeName);

  if (blobStore) {
    await blobStore.set(key, value, metadata ? { metadata } : undefined);
    return;
  }

  getMemoryStore(storeName)[key] = {
    body: await blobInputToArrayBuffer(value),
    contentType: typeof metadata?.type === "string" ? metadata.type : value instanceof Blob ? value.type : undefined,
    metadata,
    storedAt: new Date().toISOString(),
    type: value instanceof Blob ? value.type : typeof value
  } satisfies MemoryBlobRecord;
}

export async function readBlob(storeName: string, key: string) {
  const vercelToken = getVercelBlobToken();

  if (vercelToken) {
    try {
      const result = await getVercelBlob(vercelPath(storeName, key), {
        access: "private",
        useCache: false,
        token: vercelToken
      });
      if (result?.statusCode !== 200 || !result.stream) return null;

      return {
        body: await new Response(result.stream).arrayBuffer(),
        contentType: result.headers.get("content-type") ?? undefined
      };
    } catch {
      return null;
    }
  }

  const blobStore = getBlobStore(storeName);

  if (blobStore) {
    try {
      const body = (await blobStore.get(key, { type: "arrayBuffer" })) as ArrayBuffer | null;
      if (!body) return null;

      return { body };
    } catch {
      return null;
    }
  }

  const stored = getMemoryStore(storeName)[key] as MemoryBlobRecord | undefined;
  return stored?.body
    ? {
        body: stored.body,
        contentType: stored.contentType
      }
    : null;
}

export async function listJson<T>(storeName: string, prefix = ""): Promise<T[]> {
  const vercelToken = getVercelBlobToken();

  if (vercelToken) {
    try {
      const values: T[] = [];
      let cursor: string | undefined;

      do {
        const result = await listVercelBlobs({
          cursor,
          mode: "expanded",
          prefix: vercelPath(storeName, prefix),
          token: vercelToken
        });

        for (const item of result.blobs) {
          if (item.pathname === vercelPath(storeName, INDEX_KEY)) continue;
          const value = await readVercelJsonPath<T>(item.pathname, vercelToken);
          if (value) values.push(value);
        }

        cursor = result.cursor;
        if (!result.hasMore) break;
      } while (cursor);

      if (values.length) return values;
      return listJsonFromIndex<T>(storeName, prefix);
    } catch {
      return listJsonFromIndex<T>(storeName, prefix);
    }
  }

  const blobStore = getBlobStore(storeName);

  if (blobStore) {
    try {
      const result = await blobStore.list({ prefix });
      const values: T[] = [];

      for (const item of result.blobs) {
        const value = await readJson<T>(storeName, item.key);
        if (value) values.push(value);
      }

      if (values.length) return values;
      return listJsonFromIndex<T>(storeName, prefix);
    } catch {
      return listJsonFromIndex<T>(storeName, prefix);
    }
  }

  return Object.entries(getMemoryStore(storeName))
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value as T);
}

async function readVercelJson<T>(storeName: string, key: string, token: string) {
  return readVercelJsonPath<T>(vercelPath(storeName, key), token);
}

async function readVercelJsonPath<T>(pathname: string, token: string): Promise<T | null> {
  try {
    const result = await getVercelBlob(pathname, {
      access: "private",
      useCache: false,
      token
    });

    if (result?.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeVercelJson<T>(storeName: string, key: string, value: T, token: string) {
  const pathname = vercelPath(storeName, key);

  if (value === null) {
    await deleteVercelBlob(pathname, { token });
    return;
  }

  await putVercelBlob(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
      contentType: "application/json",
      token
    });
}

async function blobInputToArrayBuffer(value: BlobInput) {
  if (typeof value === "string") return new TextEncoder().encode(value).buffer;
  if (value instanceof Blob) return value.arrayBuffer();
  return value;
}

async function listJsonFromIndex<T>(storeName: string, prefix = "") {
  const indexedKeys = await readJson<string[]>(storeName, INDEX_KEY);
  if (!indexedKeys?.length) return [];

  const values: T[] = [];
  for (const key of indexedKeys.filter((item) => item.startsWith(prefix))) {
    const value = await readJson<T>(storeName, key);
    if (value) values.push(value);
  }

  return values;
}

async function updateKeyIndex(storeName: string, key: string, remove: boolean) {
  if (key === INDEX_KEY) return;

  const vercelToken = getVercelBlobToken();

  if (vercelToken) {
    try {
      const current = (await readVercelJson<string[]>(storeName, INDEX_KEY, vercelToken)) ?? [];
      const next = remove
        ? current.filter((item) => item !== key)
        : Array.from(new Set([...current, key])).sort();
      await writeVercelJson(storeName, INDEX_KEY, next, vercelToken);
    } catch {
      // Listing is an optimization path; the original write has already succeeded.
    }
    return;
  }

  const blobStore = getBlobStore(storeName);

  if (blobStore) {
    try {
      const current = ((await blobStore.get(INDEX_KEY, { type: "json" })) as string[] | null) ?? [];
      const next = remove
        ? current.filter((item) => item !== key)
        : Array.from(new Set([...current, key])).sort();
      await blobStore.setJSON(INDEX_KEY, next);
    } catch {
      // Listing is an optimization path; the original write has already succeeded.
    }
    return;
  }

  const store = getMemoryStore(storeName);
  const current = Array.isArray(store[INDEX_KEY]) ? (store[INDEX_KEY] as string[]) : [];
  store[INDEX_KEY] = remove ? current.filter((item) => item !== key) : Array.from(new Set([...current, key])).sort();
}
