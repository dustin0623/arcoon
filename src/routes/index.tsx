import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "A simple hello world app." },
      { property: "og:title", content: "Hello World" },
      { property: "og:description", content: "A simple hello world app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-5xl font-bold tracking-tight text-foreground">
        Hello, World!
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your app is up and running.
      </p>
    </div>
  );
}
