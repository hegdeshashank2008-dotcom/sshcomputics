import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LoginNotice } from "@/components/LoginNotice";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Coding & Learning Resources for Students | Shashank Computics" },
      {
        name: "description",
        content:
          "A curated shelf of free coding platforms, subject-wise study material, video courses and career resources for school and engineering students.",
      },
      { property: "og:title", content: "Coding & Learning Resources | Shashank Computics" },
      {
        property: "og:description",
        content: "Free platforms for coding practice, subject material, courses and career prep.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourcesPage,
});

type Resource = {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string | null;
};

const EMPTY = { title: "", category: "coding", url: "", description: "" };

function ResourcesPage() {
  const [type, setType] = useState<string>("");
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as Resource[];
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["resource_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("id,title,subject,class_level,category,external_url,file_path")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim() || !draft.url.trim()) throw new Error("Title and link are required.");
      const { error } = await supabase.from("resources").insert({
        title: draft.title.trim(),
        category: draft.category.trim() || "other",
        url: draft.url.trim(),
        description: draft.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ ...EMPTY });
      setAdding(false);
      toast.success("Resource added.");
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const types = Array.from(new Set(resources.map((r) => r.category)));
  const filtered = type ? resources.filter((r) => r.category === type) : resources;

  return (
    <div className="section-shell pt-28 pb-24">
      <LoginNotice what="saved resources and admin tools" />
      <h1 className="text-4xl font-bold md:text-5xl">
        Coding & <span className="text-gradient">Other Resources</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Free, legitimate and genuinely useful. No paywalls, no filler.
      </p>

      {isAdmin && (
        <div className="mt-6">
          <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)} className="gap-1.5">
            <Plus className="h-4 w-4" /> {adding ? "Close" : "Add resource"}
          </Button>
          {adding && (
            <div className="glass-card mt-4 grid gap-3 p-6 md:grid-cols-3">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Title"
              />
              <Input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Category"
              />
              <Input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://…"
              />
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="md:col-span-3"
              />
              <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-fit">
                Publish resource
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setType("")}
          className={[
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            type === ""
              ? "border-primary/60 bg-primary/20 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
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
              type === t
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading resources…</p>}
        {filtered.map((r) => (
          <ResourceCard key={r.id} resource={r} isAdmin={isAdmin} />
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Subject-wise study material</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The latest documents published across classes, coding languages and engineering branches.
        </p>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {materials.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <span>
                {m.title}
                <span className="ml-2 text-xs text-muted-foreground">
                  {[m.subject, m.class_level ? `Class ${m.class_level}` : null, m.category]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {m.external_url && (
                <a
                  href={m.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                  aria-label="Open resource"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResourceCard({ resource, isAdmin }: { resource: Resource; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: resource.title,
    category: resource.category,
    url: resource.url,
    description: resource.description ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("resources")
        .update({
          title: draft.title.trim(),
          category: draft.category.trim(),
          url: draft.url.trim(),
          description: draft.description.trim() || null,
        })
        .eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      toast.success("Resource updated.");
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resources").delete().eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource deleted.");
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing) {
    return (
      <article className="glass-card space-y-2 p-6">
        <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Input
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        />
        <Input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5">
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5">
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="glass-card flex h-full flex-col p-6">
      <p className="text-xs tracking-widest text-primary uppercase">{resource.category}</p>
      <h2 className="mt-2 text-lg font-semibold">{resource.title}</h2>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{resource.description}</p>
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-5">
        <Button size="sm" variant="outline" className="gap-1.5">
          Visit <ExternalLink className="h-4 w-4" />
        </Button>
      </a>
      {isAdmin && (
        <div className="mt-4 flex gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => remove.mutate()}
            className="flex items-center gap-1.5 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </article>
  );
}
