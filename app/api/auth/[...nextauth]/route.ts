import { handlers } from "@/lib/auth";

export const runtime = "nodejs";

// NextAuth v5 Route Handler
export const { GET, POST } = handlers;
