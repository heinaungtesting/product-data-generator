const textEncoder = new TextEncoder();

export const AUTH_COOKIE_NAME = "pdg_auth";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const PUBLIC_AUTH_PATHS = ["/login", "/api/login"];

type AuthConfig = {
  username: string;
  password: string;
  sessionSecret: string;
};

const toHex = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let index = 0; index < bytes.length; index += 1) {
    hex += bytes[index].toString(16).padStart(2, "0");
  }
  return hex;
};

const deriveSessionToken = async ({ username, password, sessionSecret }: AuthConfig) => {
  const payload = `${username}:${password}:${sessionSecret}`;
  const encoded = textEncoder.encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
};

const getAuthConfig = (): AuthConfig => {
  const username = process.env.PDG_AUTH_USERNAME ?? "";
  const password = process.env.PDG_AUTH_PASSWORD ?? "";
  const sessionSecret =
    process.env.PDG_AUTH_SESSION_SECRET && process.env.PDG_AUTH_SESSION_SECRET.length > 0
      ? process.env.PDG_AUTH_SESSION_SECRET
      : `${username}:${password}`;

  if (!username || !password) {
    throw new Error("PDG auth configuration missing PDG_AUTH_USERNAME or PDG_AUTH_PASSWORD.");
  }

  return { username, password, sessionSecret };
};

export const authConfigReady = () => {
  try {
    getAuthConfig();
    return true;
  } catch {
    return false;
  }
};

export const credentialsMatch = (username: string, password: string) => {
  const config = getAuthConfig();
  return username === config.username && password === config.password;
};

export const buildSessionToken = async () => {
  const config = getAuthConfig();
  return deriveSessionToken(config);
};

export const hasValidSessionCookie = async (cookieValue?: string) => {
  if (!cookieValue) {
    return false;
  }
  const expected = await buildSessionToken();
  return cookieValue === expected;
};

export const isApiRoute = (pathname: string) => pathname.startsWith("/api");

export const isPublicAuthPath = (pathname: string) =>
  PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path.endsWith("/") ? path : `${path}/`),
  );

export const missingAuthEnvMessage =
  "Set PDG_AUTH_USERNAME and PDG_AUTH_PASSWORD in your environment to enable login.";
