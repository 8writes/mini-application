export async function middleware(request) {
  // Block non-browser requests
  if (request.nextUrl.pathname === "/api/wrapper") {
    const userAgent = request.headers.get("user-agent") || "";
    if (!/Mozilla|Chrome|Safari|Firefox/i.test(userAgent)) {
      return new Response("Automation detected", { status: 403 });
    }
  }

  return NextResponse.next();
}
