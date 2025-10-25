import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  authConfigReady,
  buildSessionToken,
  credentialsMatch,
  missingAuthEnvMessage,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!authConfigReady()) {
    return NextResponse.json({ error: missingAuthEnvMessage }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { username, password } = (payload ?? {}) as Record<string, unknown>;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "username and password are required." },
      { status: 400 },
    );
  }

  if (!credentialsMatch(username, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const sessionToken = await buildSessionToken();
  const response = NextResponse.json({ success: true });

  response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
