import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelMeta } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function SerienPage() {
  const [meta, categories] = await Promise.all([
    getPublicChannelMeta("series"),
    getPublicCategories("series"),
  ]);

  return (
    <PublicContentBrowser
      kind="series"
      channelCount={meta.channelCount}
      lastUpdated={meta.fetchedAt}
      initialCategories={categories}
    />
  );
}
