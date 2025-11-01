import { createHash } from "node:crypto";

export const MAX_LEGAL_TEXT_LENGTH = 600;

const CLAIM_TERMS = ["治る", "治癒", "完治", "効く", "予防"];
const DISEASE_TERMS = [
  "がん",
  "癌",
  "糖尿病",
  "高血圧",
  "心臓病",
  "うつ病",
  "アトピー",
  "喘息",
  "関節炎",
  "肝炎",
  "脳卒中",
  "花粉症",
  "インフルエンザ",
];

const CLAIM_PATTERN = new RegExp(`(?:${CLAIM_TERMS.join("|")})(?:する|し|させる)?`, "gu");
const DISEASE_PATTERN = new RegExp(`(?:${DISEASE_TERMS.join("|")})`, "gu");

const BANNED_PATTERNS: RegExp[] = [CLAIM_PATTERN, DISEASE_PATTERN];

const COLLAPSE_WHITESPACE = /\s+/gu;

export type Sanitizable = string | null | undefined;

export const sanitizeText = (input: Sanitizable): string => {
  if (!input) {
    return "";
  }
  let sanitized = `${input}`.normalize("NFKC");

  for (const pattern of BANNED_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  sanitized = sanitized.replace(COLLAPSE_WHITESPACE, " ").trim();

  if (sanitized.length > MAX_LEGAL_TEXT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_LEGAL_TEXT_LENGTH);
  }

  return sanitized;
};

export const sanitizeLocalized = <T extends Record<string, Sanitizable>>(value: T) => {
  const result: Record<string, string> = {};
  Object.entries(value ?? {}).forEach(([key, text]) => {
    result[key] = sanitizeText(text);
  });
  return result;
};

export const computeSha256 = (buffer: ArrayBuffer | ArrayBufferView): string => {
  const hash = createHash("sha256");
  if (ArrayBuffer.isView(buffer)) {
    hash.update(Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength));
  } else {
    hash.update(Buffer.from(buffer));
  }
  return `sha256:${hash.digest("hex")}`;
};
