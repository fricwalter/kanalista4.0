import PublicContentBrowser from "@/app/_components/public-content-browser";
import { getPublicCategories, getPublicChannelCount } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function SerienPage() {
  const [channelCount, categories] = await Promise.all([
    getPublicChannelCount("series"),
    getPublicCategories("series"),
  ]);

  return (
    <PublicContentBrowser
      kind="series"
      channelCount={channelCount}
      initialCategories={categories}
    />
  );
}
