import { computeSha256 } from "./lawSafe";

export type ResolvedImage = {
  buffer: Uint8Array;
  contentType: string;
  extension: string;
  hash: string;
  filename: string;
};

const DATA_URI_REGEX = /^data:([^;]+);base64,(.+)$/u;

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const guessExtension = (mime: string, fallback?: string) => {
  if (MIME_EXTENSION_MAP[mime]) {
    return MIME_EXTENSION_MAP[mime];
  }
  if (fallback && /^[a-z0-9]+$/iu.test(fallback)) {
    return fallback.toLowerCase();
  }
  return "bin";
};

const parseDataUri = (source: string): ResolvedImage => {
  const match = DATA_URI_REGEX.exec(source);
  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid data URI");
  }
  const contentType = match[1];
  const binary = Buffer.from(match[2], "base64");
  const bytes = new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
  const hash = computeSha256(bytes);
  const extension = guessExtension(contentType);
  return {
    buffer: bytes,
    contentType,
    extension,
    hash,
    filename: `${hash}.${extension}`,
  };
};

const extractExtensionFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split(".");
    if (parts.length > 1) {
      return parts.pop()?.split("?")[0]?.split("#")[0];
    }
  } catch {
    // noop
  }
  return undefined;
};

export const resolveImage = async (source: string, filename?: string): Promise<ResolvedImage> => {
  if (source.startsWith("data:")) {
    const parsed = parseDataUri(source);
    if (filename) {
      parsed.filename = filename;
    }
    return parsed;
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const ext = guessExtension(contentType, extractExtensionFromUrl(source));
  const bytes = new Uint8Array(arrayBuffer);
  const hash = computeSha256(bytes);
  return {
    buffer: bytes,
    contentType,
    extension: ext,
    hash,
    filename: filename ?? `${hash}.${ext}`,
  };
};
