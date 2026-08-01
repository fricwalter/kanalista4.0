import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelCount } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function LivePage() {
  const [channelCount, categories] = await Promise.all([
    getPublicChannelCount("live"),
    getPublicCategories("live"),
  ]);

  return (
    <PublicContentBrowser
      kind="live"
      title="Live-Kanaele"
      description={`Oeffentliche Uebersicht mit ${channelCount} Live-Kanaelen.`}
      initialCategories={categories}
    />
  );
}
