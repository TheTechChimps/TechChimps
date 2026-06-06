import { FinalSignoffClient } from "@/components/signoff/final-signoff-client";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SignoffPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export const metadata = createMetadata({
  title: "Final Delivery Acceptance",
  description: "Review and digitally sign final TechChimps delivery acceptance for a completed order.",
  path: "/signoff"
});

export default async function SignoffPage({ params }: SignoffPageProps) {
  const { token } = await params;
  return <FinalSignoffClient token={token} />;
}
