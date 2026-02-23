import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/resolve-auth-user";

export const runtime = "edge";

export default async function CredentialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const currentUser = await resolveSessionUser(session);

  if (!currentUser) {
    redirect("/");
  }

  if (!currentUser.isAdmin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
