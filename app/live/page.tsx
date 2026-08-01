import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelMeta } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function LivePage() {
  const [meta, categories] = await Promise.all([
    getPublicChannelMeta("live"),
    getPublicCategories("live"),
  ]);

  return (
    <PublicContentBrowser
      kind="live"
      channelCount={meta.channelCount}
      lastUpdated={meta.fetchedAt}
      initialCategories={categories}
    />
  );
}
