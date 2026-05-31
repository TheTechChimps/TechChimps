import { RequestBuilder } from "@/components/sections/request-builder";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Start a Request",
  description: "Start a TechChimps project request, get an instant estimate, choose delivery speed, pay securely, or make a custom offer.",
  path: "/request",
  keywords: ["affordable web design UK", "custom software development", "automation services UK"]
});

export default function RequestPage() {
  return (
    <main>
      <RequestBuilder />
    </main>
  );
}
