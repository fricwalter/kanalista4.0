import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelData } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function FilmePage() {
  const [channelData, categories] = await Promise.all([
    getPublicChannelData("vod"),
    getPublicCategories("vod"),
  ]);

  return (
    <PublicContentBrowser
      kind="vod"
      title="Filme"
      description={`Oeffentliche Uebersicht mit ${channelData.count} Filmen.`}
      initialItems={channelData.items}
      initialCategories={categories}
    />
  );
}
