import { WatermarkedPreviewClient } from "@/components/preview/watermarked-preview-client";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Watermarked Preview",
  description: "Review a protected TechChimps customer preview.",
  path: "/preview"
});

type PreviewPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;

  return <WatermarkedPreviewClient token={token} />;
}
