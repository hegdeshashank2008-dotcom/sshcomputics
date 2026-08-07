import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CLASSES = Array.from({ length: 12 }, (_, i) => String(i + 1));

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Study Materials — Class 1 to 12, Coding & Engineering | Shashank Computics" },
      {
        name: "description",
        content:
          "Browse free study materials organised by class 1-12, coding tracks and engineering subjects. Notes, textbooks and files published by Shashank Computics.",
      },
      { property: "og:title", content: "Study Materials | Shashank Computics" },
      {
        property: "og:description",
        content: "Class-wise school notes, coding tracks and engineering study material, all free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaterialsPage,
});

type Category = "school" | "coding" | "engineering";

function MaterialsPage() {
  const [category, setCategory] = useState<Category>("school");
  const [classLevel, setClassLevel] = useState<string>("");
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = materials.filter((m) => {
    const matchesClass = !classLevel || m.class_level === classLevel;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      (m.subject ?? "").toLowerCase().includes(q) ||
      (m.description ?? "").toLowerCase().includes(q);
    return matchesClass && matchesSearch;
  });

  const openFile = async (path: string) => {
    if (!user) {
      toast.error("Please sign in to download files.");
      return;
    }
    const { data, error } = await supabase.storage.from("materials").createSignedUrl(path, 120);
    if (error || !data) {
      toast.error("Could not open that file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold md:text-5xl">
        Study <span className="text-gradient">Materials</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Everything here is published by the Shashank Computics admin team. Pick your track, then
        narrow by class or search a subject.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["school", "Class 1 – 12"],
            ["coding", "Coding"],
            ["engineering", "Engineering"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setCategory(key);
              setClassLevel("");
            }}
            className={[
              "rounded-full border px-5 py-2 text-sm font-medium transition-all",
              category === key
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {category === "school" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setClassLevel("")}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              classLevel === ""
                ? "border-primary/60 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            All classes
          </button>
          {CLASSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClassLevel(c)}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                classLevel === c
                  ? "border-primary/60 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Class {c}
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-6 max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or subject…"
          className="pl-9"
        />
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading materials…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-muted-foreground">No materials here yet — check back soon.</p>
        )}
        {filtered.map((m) => (
          <article key={m.id} className="glass-card flex h-full flex-col p-6">
            <span className="inline-flex w-fit rounded-lg bg-primary/15 p-2.5 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{m.title}</h2>
            <p className="mt-1 text-xs tracking-wider text-primary uppercase">
              {[m.class_level ? `Class ${m.class_level}` : null, m.subject]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{m.description}</p>
            <div className="mt-5 flex gap-2">
              {m.file_path && (
                <Button size="sm" onClick={() => openFile(m.file_path!)} className="gap-1.5">
                  <Download className="h-4 w-4" /> Download
                </Button>
              )}
              {m.external_url && (
                <a href={m.external_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-4 w-4" /> Open
                  </Button>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
