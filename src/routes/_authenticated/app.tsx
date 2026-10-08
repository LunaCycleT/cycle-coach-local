import { createFileRoute } from "@tanstack/react-router";
import CycleApp from "@/components/luna/CycleApp";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "My Cycle — Luna" },
      { name: "description", content: "Your cycle calendar, daily insights and AI coach, synced to your account." },
      { property: "og:title", content: "My Cycle — Luna" },
      { property: "og:description", content: "Your cycle calendar, daily insights and AI coach, synced to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CycleApp,
});
