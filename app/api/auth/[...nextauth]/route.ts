import { handlers } from "@/lib/auth";

export const runtime = "edge";

// NextAuth v5 Route Handler
export const { GET, POST } = handlers;
