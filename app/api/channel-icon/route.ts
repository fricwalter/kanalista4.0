const ALLOWED_HOSTS = new Set([
  "51.158.145.100",
  "103.176.90.92",
  "103.176.90.95",
  "103.176.90.118",
  "picons.cmshulk.com",
  "logo.protv.cc",
  "images.seeklogo.com",
]);

export const runtime = "edge";

function errorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const source = new URL(request.url).searchParams.get("url");
  if (!source) return errorResponse("Missing image URL", 400);

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return errorResponse("Invalid image URL", 400);
  }

  if (!ALLOWED_HOSTS.has(imageUrl.hostname.toLowerCase())) {
    return errorResponse("Image host is not allowed", 403);
  }
  if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
    return errorResponse("Unsupported image protocol", 400);
  }

  const deliveryUrl = new URL("https://wsrv.nl/");
  deliveryUrl.searchParams.set("url", imageUrl.toString().replace(/^http:\/\//, ""));
  deliveryUrl.searchParams.set("w", "320");
  deliveryUrl.searchParams.set("h", "320");
  deliveryUrl.searchParams.set("fit", "inside");
  deliveryUrl.searchParams.set("output", "png");

  return new Response(null, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=86400",
      Location: deliveryUrl.toString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
