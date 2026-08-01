import MediaDetail from "@/app/_components/media-detail";

type DetailPageProps = {
  params: { slug: string };
  searchParams: { title?: string; year?: string };
};

export default function FilmDetailPage({ params, searchParams }: DetailPageProps) {
  return (
    <MediaDetail
      kind="movie"
      slug={params.slug}
      sourceTitle={searchParams.title?.slice(0, 160) || "Film"}
      year={searchParams.year || ""}
    />
  );
}
