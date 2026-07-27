import "server-only";

const MEBIBYTE = 1024 * 1024;

export const MAX_EVIDENCE_FILE_BYTES = Number(
  process.env.BETA_MAX_EVIDENCE_FILE_BYTES || 10 * MEBIBYTE,
);

export const MAX_TEAM_STORAGE_BYTES = Number(
  process.env.BETA_MAX_TEAM_STORAGE_BYTES || 250 * MEBIBYTE,
);

const allowedFileTypes = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".txt": ["text/plain"],
  ".csv": ["text/csv", "application/csv", "text/plain"],
} as const;

export const EVIDENCE_FILE_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv,image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv";

function extensionOf(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLocaleLowerCase() : "";
}

export function validateEvidenceFile(file: File) {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "Choose a non-empty evidence file.";
  }
  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return `Files must be ${Math.floor(MAX_EVIDENCE_FILE_BYTES / MEBIBYTE)} MB or smaller.`;
  }

  const extension = extensionOf(file.name);
  const allowedMimes =
    allowedFileTypes[extension as keyof typeof allowedFileTypes];
  if (!allowedMimes || !allowedMimes.includes(file.type as never)) {
    return "Allowed evidence files: PNG, JPEG, WebP, PDF, TXT, or CSV.";
  }
  return null;
}

export function safeEvidenceExtension(fileName: string) {
  return extensionOf(fileName);
}

export function safeExternalUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
