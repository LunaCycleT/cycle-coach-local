import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/components/luna/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ordiva — Your Life. Your Rhythms." },
      { name: "description", content: "A private personal companion: track your cycle and sleep, view multiple calendars, and talk anything through with Ask Ordiva." },
      { property: "og:title", content: "Ordiva — Your Life. Your Rhythms." },
      { property: "og:description", content: "A private personal companion: track your cycle and sleep, view multiple calendars, and talk anything through with Ask Ordiva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
