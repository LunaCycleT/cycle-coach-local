import { createFileRoute } from "@tanstack/react-router";
import CycleApp from "@/components/luna/CycleApp";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "My Cycle — Ordiva" },
      { name: "description", content: "Your cycle calendar, daily insights and Ask Ordiva, synced to your account." },
      { property: "og:title", content: "My Cycle — Ordiva" },
      { property: "og:description", content: "Your cycle calendar, daily insights and Ask Ordiva, synced to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CycleApp,
});
