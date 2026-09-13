import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ArenaCanvas = lazy(() => import("@/phaser/ArenaCanvas"));

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Play ARCOON — Wave Survival Roguelite" },
      {
        name: "description",
        content:
          "Survive escalating enemy waves in ARCOON's top-down pixel arena. Move, aim and fire your bow to rack up kills and points.",
      },
      { property: "og:title", content: "Play ARCOON — Wave Survival Roguelite" },
      {
        property: "og:description",
        content:
          "Survive escalating enemy waves in ARCOON's top-down pixel arena. Move, aim and fire your bow to rack up kills and points.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

function Fallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p className="text-sm tracking-widest text-muted-foreground uppercase">Loading arena</p>
    </div>
  );
}

function GamePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      <h1 className="sr-only">Arena wave survival</h1>
      <ClientOnly fallback={<Fallback />}>
        <Suspense fallback={<Fallback />}>
          <ArenaCanvas />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
