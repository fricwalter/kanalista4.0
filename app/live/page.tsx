import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelData } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function LivePage() {
  const [channelData, categories] = await Promise.all([
    getPublicChannelData("live"),
    getPublicCategories("live"),
  ]);

  return (
    <PublicContentBrowser
      kind="live"
      title="Live-Kanaele"
      description={`Oeffentliche Uebersicht mit ${channelData.count} Live-Kanaelen.`}
      initialItems={channelData.items}
      initialCategories={categories}
    />
  );
}
