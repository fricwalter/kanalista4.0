import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelCount } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function FilmePage() {
  const [channelCount, categories] = await Promise.all([
    getPublicChannelCount("vod"),
    getPublicCategories("vod"),
  ]);

  return (
    <PublicContentBrowser
      kind="vod"
      title="Filme"
      description={`Oeffentliche Uebersicht mit ${channelCount} Filmen.`}
      initialCategories={categories}
    />
  );
}
