import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/components/luna/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ordiva — Your Personal Cycle Companion" },
      { name: "description", content: "Track your cycle, get daily phase insights and chat with Ordiva, your AI cycle coach." },
      { property: "og:title", content: "Ordiva — Your Personal Cycle Companion" },
      { property: "og:description", content: "Track your cycle, get daily phase insights and chat with Ordiva, your AI cycle coach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
