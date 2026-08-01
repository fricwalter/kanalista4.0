import HomeContent from "@/app/_components/home-content";
import { getPublicChannelCount } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function Home() {
  const [live, vod, series] = await Promise.all([
    getPublicChannelCount("live"),
    getPublicChannelCount("vod"),
    getPublicChannelCount("series"),
  ]);

  return <HomeContent live={live} vod={vod} series={series} />;
}
