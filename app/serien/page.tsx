import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelData } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function SerienPage() {
  const [channelData, categories] = await Promise.all([
    getPublicChannelData("series"),
    getPublicCategories("series"),
  ]);

  return (
    <PublicContentBrowser
      kind="series"
      title="Serien"
      description={`Oeffentliche Uebersicht mit ${channelData.count} Serien.`}
      initialItems={channelData.items}
      initialCategories={categories}
    />
  );
}
