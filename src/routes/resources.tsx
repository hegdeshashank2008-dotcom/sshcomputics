import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Coding & Learning Resources for Students | Shashank Computics" },
      {
        name: "description",
        content:
          "A curated shelf of free coding platforms, practice sites, video courses and career resources hand-picked for school and engineering students.",
      },
      { property: "og:title", content: "Coding & Learning Resources | Shashank Computics" },
      {
        property: "og:description",
        content: "Free platforms for coding practice, courses, tools and career prep in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const [type, setType] = useState<string>("");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("resource_type", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const types = Array.from(new Set(resources.map((r) => r.resource_type)));
  const filtered = type ? resources.filter((r) => r.resource_type === type) : resources;

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold md:text-5xl">
        Coding & <span className="text-gradient">Other Resources</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Free, legitimate and genuinely useful. No paywalls, no filler.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setType("")}
          className={[
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            type === "" ? "border-primary/60 bg-primary/20 text-primary" : "border-border text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={[
              "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
              type === t ? "border-primary/60 bg-primary/20 text-primary" : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading resources…</p>}
        {filtered.map((r) => (
          <article key={r.id} className="glass-card flex h-full flex-col p-6">
            <p className="text-xs tracking-widest text-primary uppercase">{r.resource_type}</p>
            <h2 className="mt-2 text-lg font-semibold">{r.title}</h2>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{r.description}</p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-5">
              <Button size="sm" variant="outline" className="gap-1.5">
                Visit <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
