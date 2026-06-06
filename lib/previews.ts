import { randomBytes, randomUUID } from "crypto";
import { addInboxMessage, ensureCustomerForOrder } from "@/lib/accounts";
import { appendLiveChatMessage } from "@/lib/live-chat";
import { getOrder, listOrders } from "@/lib/orders";
import { listJson, readBlob, readJson, writeBlob, writeJson } from "@/lib/storage";

export type PreviewAssetKind = "audio" | "document" | "image" | "link" | "video";
export type PreviewStatus = "sent" | "viewed" | "approved" | "changes_requested" | "archived";

export type PreviewAsset = {
  externalUrl?: string;
  key?: string;
  kind: PreviewAssetKind;
  mimeType: string;
  name: string;
  size?: number;
};

export type PreviewRecord = {
  id: string;
  token: string;
  orderReference: string;
  orderServiceName: string;
  customerName: string;
  customerEmail: string;
  title: string;
  note?: string;
  asset: PreviewAsset;
  status: PreviewStatus;
  firstViewedAt?: string;
  lastViewedAt?: string;
  viewCount: number;
  responseAt?: string;
  responseMessage?: string;
  responseStatus?: "approved" | "changes_requested";
  createdAt: string;
  updatedAt: string;
};

export type PublicPreview = {
  asset: Omit<PreviewAsset, "key"> & {
    src: string;
  };
  customerName: string;
  note?: string;
  orderReference: string;
  serviceName: string;
  status: PreviewStatus;
  title: string;
  token: string;
  viewCount: number;
};

const PREVIEW_STORE = "techchimps-previews";
const PREVIEW_ASSET_STORE = "techchimps-preview-assets";
const PREVIEW_PREFIX = "previews/";
const TOKEN_PREFIX = "tokens/";
const MAX_PREVIEW_FILE_SIZE = 8 * 1024 * 1024;

function now() {
  return new Date().toISOString();
}

function token() {
  return randomBytes(24).toString("base64url");
}

function previewKey(id: string) {
  return `${PREVIEW_PREFIX}${id}`;
}

function tokenKey(value: string) {
  return `${TOKEN_PREFIX}${value}`;
}

function cleanName(name: string) {
  return name.replace(/[^A-Za-z0-9._ -]/g, "").trim().slice(0, 120) || "preview-file";
}

function assetKey(id: string, name: string) {
  return `${PREVIEW_PREFIX}${id}/${cleanName(name)}`;
}

function kindFromMime(mimeType: string, nameOrUrl = ""): PreviewAssetKind {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = nameOrUrl.toLowerCase();

  if (normalizedMime.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)$/i.test(normalizedName)) return "image";
  if (normalizedMime.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(normalizedName)) return "video";
  if (normalizedMime.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(normalizedName)) return "audio";
  if (normalizedMime.includes("pdf") || /\.(pdf|docx?|pptx?)$/i.test(normalizedName)) return "document";
  return "link";
}

function assertPreviewFile(file: File) {
  if (file.size > MAX_PREVIEW_FILE_SIZE) {
    throw new Error("Preview uploads are limited to 8MB. Use a hosted preview URL for larger files.");
  }
}

function normalizeExternalUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

async function savePreview(preview: PreviewRecord) {
  await writeJson(PREVIEW_STORE, previewKey(preview.id), preview);
  await writeJson(PREVIEW_STORE, tokenKey(preview.token), preview.id);
  return preview;
}

export function previewUrl(preview: Pick<PreviewRecord, "token">, origin?: string) {
  const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "https://techchimps.com";
  return new URL(`/preview/${preview.token}`, baseUrl).toString();
}

export async function listPreviews() {
  const previews = await listJson<PreviewRecord>(PREVIEW_STORE, PREVIEW_PREFIX);
  return previews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPreviewByToken(value: string) {
  const id = await readJson<string>(PREVIEW_STORE, tokenKey(value));
  return id ? readJson<PreviewRecord>(PREVIEW_STORE, previewKey(id)) : null;
}

export async function listPreviewsForOrder(reference: string) {
  return (await listPreviews()).filter((preview) => preview.orderReference === reference);
}

export async function latestPreviewForOrder(reference: string) {
  return (await listPreviewsForOrder(reference))[0] ?? null;
}

export async function deletePreview(preview: Pick<PreviewRecord, "id" | "token">) {
  await Promise.all([
    writeJson<PreviewRecord | null>(PREVIEW_STORE, previewKey(preview.id), null),
    writeJson<string | null>(PREVIEW_STORE, tokenKey(preview.token), null)
  ]);
}

export async function createAndSendPreview({
  externalUrl,
  file,
  note,
  origin,
  reference,
  title
}: {
  externalUrl?: string;
  file?: File;
  note?: string;
  origin?: string;
  reference: string;
  title: string;
}) {
  const order = await getOrder(reference);
  if (!order) throw new Error("Order not found.");

  const normalizedUrl = normalizeExternalUrl(externalUrl);
  if (!file && !normalizedUrl) throw new Error("Upload a preview file or paste a preview URL.");

  const id = randomUUID();
  const createdAt = now();
  const safeTitle = title.trim() || `${order.serviceName} preview`;
  const asset = file ? await buildUploadedAsset(id, file) : buildExternalAsset(normalizedUrl);
  const preview: PreviewRecord = {
    id,
    token: token(),
    orderReference: order.reference,
    orderServiceName: order.serviceName,
    customerName: order.contactName,
    customerEmail: order.contactEmail,
    title: safeTitle,
    note: note?.trim() || undefined,
    asset,
    status: "sent",
    viewCount: 0,
    createdAt,
    updatedAt: createdAt
  };
  const saved = await savePreview(preview);
  const url = previewUrl(saved, origin);
  const message =
    `Your watermarked TechChimps preview is ready: ${url} Reply in this chat if you want changes, or approve it from the preview page.`;
  const account = await ensureCustomerForOrder(order);

  await Promise.all([
    appendLiveChatMessage({
      author: "TechChimps",
      body: message,
      role: "agent",
      sessionId: order.chatSessionId
    }),
    addInboxMessage({
      userId: account.id,
      author: "TechChimps",
      subject: `${safeTitle} preview is ready`,
      body: message,
      projectReference: order.reference
    })
  ]);

  return { preview: saved, url };
}

async function buildUploadedAsset(id: string, file: File): Promise<PreviewAsset> {
  assertPreviewFile(file);
  const name = cleanName(file.name);
  const mimeType = file.type || "application/octet-stream";
  const key = assetKey(id, name);

  await writeBlob(PREVIEW_ASSET_STORE, key, await file.arrayBuffer(), {
    fileName: name,
    size: file.size,
    type: mimeType
  });

  return {
    key,
    kind: kindFromMime(mimeType, name),
    mimeType,
    name,
    size: file.size
  };
}

function buildExternalAsset(externalUrl: string): PreviewAsset {
  const url = new URL(externalUrl);
  return {
    externalUrl,
    kind: kindFromMime("", url.pathname),
    mimeType: "text/uri-list",
    name: cleanName(url.pathname.split("/").pop() || url.hostname)
  };
}

function toPublicPreview(preview: PreviewRecord): PublicPreview {
  return {
    asset: {
      externalUrl: preview.asset.externalUrl,
      kind: preview.asset.kind,
      mimeType: preview.asset.mimeType,
      name: preview.asset.name,
      size: preview.asset.size,
      src: preview.asset.externalUrl || `/api/preview/${preview.token}/asset`
    },
    customerName: preview.customerName,
    note: preview.note,
    orderReference: preview.orderReference,
    serviceName: preview.orderServiceName,
    status: preview.status,
    title: preview.title,
    token: preview.token,
    viewCount: preview.viewCount
  };
}

export async function getPublicPreview(value: string) {
  const preview = await getPreviewByToken(value);
  if (!preview || preview.status === "archived") return null;

  const viewedAt = now();
  const nextStatus = preview.status === "sent" ? "viewed" : preview.status;
  const viewed = await savePreview({
    ...preview,
    firstViewedAt: preview.firstViewedAt ?? viewedAt,
    lastViewedAt: viewedAt,
    status: nextStatus,
    updatedAt: viewedAt,
    viewCount: preview.viewCount + 1
  });

  return toPublicPreview(viewed);
}

export async function readPreviewAsset(value: string) {
  const preview = await getPreviewByToken(value);
  if (!preview?.asset.key || preview.status === "archived") return null;

  const file = await readBlob(PREVIEW_ASSET_STORE, preview.asset.key);
  if (!file) return null;

  return {
    body: file.body,
    mimeType: preview.asset.mimeType || file.contentType || "application/octet-stream",
    name: preview.asset.name
  };
}

export async function respondToPreview({
  action,
  message,
  token: value
}: {
  action: "approved" | "changes_requested";
  message?: string;
  token: string;
}) {
  const preview = await getPreviewByToken(value);
  if (!preview || preview.status === "archived") throw new Error("Preview link is not available.");

  const order = await getOrder(preview.orderReference);
  const respondedAt = now();
  const updated = await savePreview({
    ...preview,
    responseAt: respondedAt,
    responseMessage: message?.trim() || undefined,
    responseStatus: action,
    status: action,
    updatedAt: respondedAt
  });

  if (order) {
    await appendLiveChatMessage({
      author: preview.customerName || "Customer",
      body:
        action === "approved"
          ? `Preview approved for ${preview.orderServiceName}. ${message?.trim() ? `Customer note: ${message.trim()}` : ""}`.trim()
          : `Preview changes requested for ${preview.orderServiceName}. ${message?.trim() ? `Customer note: ${message.trim()}` : "Please check what needs adjusting."}`,
      priority: "waiting",
      role: "visitor",
      sessionId: order.chatSessionId
    });
  }

  return updated;
}

export async function previewDashboard(origin?: string) {
  const [orders, previews] = await Promise.all([listOrders(), listPreviews()]);
  const previewMap = new Map<string, PreviewRecord[]>();

  for (const preview of previews) {
    previewMap.set(preview.orderReference, [...(previewMap.get(preview.orderReference) ?? []), preview]);
  }

  return {
    orders: orders.map((order) => {
      const latest = previewMap.get(order.reference)?.[0] ?? null;
      return {
        latestPreview: latest,
        order,
        previewUrl: latest ? previewUrl(latest, origin) : ""
      };
    }),
    previews: previews.map((preview) => ({
      ...preview,
      url: previewUrl(preview, origin)
    }))
  };
}
