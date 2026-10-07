import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/booksy/workspace";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Booksy — Your floating workspace" },
    { name: "description", content: "A friendly floating book with instant access to entries, invoices, search, and voice notes." },
    { property: "og:title", content: "Booksy — Your floating workspace" },
    { property: "og:description", content: "A friendly floating book with instant access to entries, invoices, search, and voice notes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Workspace,
});
