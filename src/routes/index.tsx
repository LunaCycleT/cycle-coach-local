import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/components/luna/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ordiva — Your Personal Wellness Companion" },
      { name: "description", content: "Track your cycle, get daily phase insights and talk with Ask Ordiva, your AI assistant." },
      { property: "og:title", content: "Ordiva — Your Personal Wellness Companion" },
      { property: "og:description", content: "Track your cycle, get daily phase insights and talk with Ask Ordiva, your AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
