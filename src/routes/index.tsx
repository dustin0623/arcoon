import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const HomeShell = lazy(() => import("@/components/game/home-shell"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARCOON — Frog Archer Stage Runner" },
      {
        name: "description",
        content:
          "ARCOON is a pixel bow-combat game. Pick a map, clear every stage of escalating waves, and unlock the next hunting ground.",
      },
      { property: "og:title", content: "ARCOON — Frog Archer Stage Runner" },
      {
        property: "og:description",
        content:
          "Pick a map, clear every stage of escalating waves, and unlock the next hunting ground in ARCOON.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-brown-500">
      <p className="text-sm tracking-widest text-white uppercase">Loading ARCOON</p>
    </div>
  );
}

function Index() {
  return (
    <main data-game-route className="h-screen w-screen overflow-hidden bg-brown-500">
      <h1 className="sr-only">ARCOON — frog archer stage runner</h1>
      <ClientOnly fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <HomeShell />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
