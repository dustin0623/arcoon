import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { getMap } from "@/features/game/campaign";

const ArenaCanvas = lazy(() => import("@/phaser/ArenaCanvas"));

export const Route = createFileRoute("/game")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search["map"];
    const map = getMap(typeof raw === "string" ? raw : undefined);
    const stage = Math.max(1, Math.min(Number(search["stage"]) || 1, map.stages));
    const mapId = map.id;
    return { map: mapId, stage };
  },
  head: () => ({
    meta: [
      { title: "Play ARCOON — Clear the Stage" },
      {
        name: "description",
        content:
          "Run the stage: dodge swarms, fire your bow and clear every wave to unlock the next ARCOON stage.",
      },
      { property: "og:title", content: "Play ARCOON — Clear the Stage" },
      {
        property: "og:description",
        content:
          "Run the stage: dodge swarms, fire your bow and clear every wave to unlock the next ARCOON stage.",
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
      <p className="text-sm tracking-widest text-muted-foreground uppercase">Loading ARCOON</p>
    </div>
  );
}

function GamePage() {
  const { map, stage } = Route.useSearch();
  return (
    <main className="h-[100dvh] w-screen overflow-hidden overscroll-none bg-background">
      <h1 className="sr-only">ARCOON stage run</h1>
      <ClientOnly fallback={<Fallback />}>
        <Suspense fallback={<Fallback />}>
          <ArenaCanvas mapId={map} stage={stage} />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
