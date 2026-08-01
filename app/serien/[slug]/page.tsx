import MediaDetail from "@/app/_components/media-detail";

type DetailPageProps = {
  params: { slug: string };
  searchParams: { title?: string; year?: string };
};

export default function SerienDetailPage({ params, searchParams }: DetailPageProps) {
  return (
    <MediaDetail
      kind="tv"
      slug={params.slug}
      sourceTitle={searchParams.title?.slice(0, 160) || "Serie"}
      year={searchParams.year || ""}
    />
  );
}
