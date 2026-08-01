import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelMeta } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function FilmePage() {
  const [meta, categories] = await Promise.all([
    getPublicChannelMeta("vod"),
    getPublicCategories("vod"),
  ]);

  return (
    <PublicContentBrowser
      kind="vod"
      channelCount={meta.channelCount}
      lastUpdated={meta.fetchedAt}
      initialCategories={categories}
    />
  );
}
