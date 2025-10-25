import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authConfigReady,
  hasValidSessionCookie,
  isApiRoute,
  isPublicAuthPath,
  missingAuthEnvMessage,
} from "@/lib/auth";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const shouldSendSecurityHeaders = process.env.NODE_ENV === "production";

const withSecurityHeaders = (response: NextResponse) => {
  if (shouldSendSecurityHeaders) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
};

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicAuthPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (!authConfigReady()) {
    const response = isApiRoute(pathname)
      ? NextResponse.json({ error: missingAuthEnvMessage }, { status: 500 })
      : new NextResponse(missingAuthEnvMessage, {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
    return withSecurityHeaders(response);
  }

  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await hasValidSessionCookie(sessionCookie);

  if (authenticated) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (isApiRoute(pathname)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  const loginUrl = new URL("/login", request.url);
  const redirectTarget = `${pathname}${search}`;
  if (redirectTarget && redirectTarget !== "/") {
    loginUrl.searchParams.set("redirectTo", redirectTarget);
  }
  return withSecurityHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
};
