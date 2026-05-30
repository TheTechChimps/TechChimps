import { writeBlob, writeJson } from "@/lib/storage";

export type UploadedFileRecord = {
  id: string;
  batchId: string;
  key: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
};

const FILE_STORE = "techchimps-upload-files";
const META_STORE = "techchimps-upload-metadata";
const META_PREFIX = "uploads/";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 5;

function cleanName(name: string) {
  return name.replace(/[^A-Za-z0-9._ -]/g, "").trim().slice(0, 120) || "project-file";
}

function metadataKey(batchId: string, id: string) {
  return `${META_PREFIX}${batchId}/${id}`;
}

export async function saveUploadedFiles(batchId: string, files: File[]) {
  const safeBatchId = batchId.replace(/[^A-Za-z0-9-]/g, "").slice(0, 80);

  if (!safeBatchId) {
    throw new Error("Upload batch is missing.");
  }

  if (files.length > MAX_FILES) {
    throw new Error(`Upload up to ${MAX_FILES} files at once.`);
  }

  const records: UploadedFileRecord[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name} is too large. Keep files under 8MB.`);
    }

    const id = crypto.randomUUID();
    const name = cleanName(file.name);
    const key = `requests/${safeBatchId}/${id}-${name}`;
    const createdAt = new Date().toISOString();
    const record: UploadedFileRecord = {
      id,
      batchId: safeBatchId,
      key,
      name,
      size: file.size,
      type: file.type || "application/octet-stream",
      createdAt
    };

    await writeBlob(FILE_STORE, key, await file.arrayBuffer(), {
      batchId: safeBatchId,
      fileName: name,
      size: file.size,
      type: record.type
    });
    await writeJson(META_STORE, metadataKey(safeBatchId, id), record);
    records.push(record);
  }

  return records;
}
