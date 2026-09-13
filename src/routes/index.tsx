import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARCOON — Top-Down Bow Survival Game" },
      {
        name: "description",
        content:
          "ARCOON is a top-down pixel arena where you dodge swarms and fire your bow. Clear waves, chase a high score and see how long you last.",
      },
      { property: "og:title", content: "ARCOON — Top-Down Bow Survival Game" },
      {
        property: "og:description",
        content:
          "ARCOON is a top-down pixel arena where you dodge swarms and fire your bow. Clear waves, chase a high score and see how long you last.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground">ARCOON</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        One arena, endless waves. Move, aim, and let arrows fly — every wave hits harder and pays
        more.
      </p>
      <Link
        to="/game"
        className="mt-8 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Start playing
      </Link>
    </main>
  );
}
