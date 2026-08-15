import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, ExternalLink, FileText, Pencil, Save, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LoginNotice } from "@/components/LoginNotice";

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Study Materials — Class 1 to 12, Coding & Engineering | Shashank Computics" },
      {
        name: "description",
        content:
          "Browse free study materials by class 1-12 sections, coding languages and engineering branches. Notes, textbooks and files published by Shashank Computics.",
      },
      { property: "og:title", content: "Study Materials | Shashank Computics" },
      {
        property: "og:description",
        content: "Class-wise school notes, coding languages and engineering branch material, all free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaterialsPage,
});

type Category = "school" | "coding" | "engineering";

const CATEGORY_LABEL: Record<Category, string> = {
  school: "Class 1 – 12",
  coding: "Coding",
  engineering: "Engineering",
};

function MaterialsPage() {
  const [category, setCategory] = useState<Category>("school");
  const [sectionId, setSectionId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [search, setSearch] = useState("");
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: sections = [] } = useQuery({
    queryKey: ["material_sections", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_sections")
        .select("*")
        .eq("category", category)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["material_subjects", sectionId],
    queryFn: async () => {
      if (!sectionId) return [];
      const { data, error } = await supabase
        .from("material_subjects")
        .select("*")
        .eq("section_id", sectionId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(sectionId),
  });

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
    const matchesSection = !sectionId || m.section_id === sectionId;
    const matchesSubject = !subjectId || m.subject_id === subjectId;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      (m.subject ?? "").toLowerCase().includes(q) ||
      (m.description ?? "").toLowerCase().includes(q);
    return matchesSection && matchesSubject && matchesSearch;
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Material deleted.");
      qc.invalidateQueries({ queryKey: ["materials", category] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openFile = async (path: string) => {
    if (!user) {
      toast.error("Please sign in to open files.");
      return;
    }
    const tab = window.open("", "_blank", "noopener");
    const openMaterial = async (path: string) => {
  if (!user) {
    toast.error("Please sign in to open files.");
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from("materials")
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL:", error);
      toast.error("Could not open that file.");
      return;
    }

    // Open the PDF directly
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Error opening material:", error);
    toast.error("Could not open that file.");
  }
};

  return (
    <div className="section-shell pt-28 pb-24">
      <LoginNotice what="opening and downloading study materials" />
      <h1 className="text-4xl font-bold md:text-5xl">
        Study <span className="text-gradient">Materials</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Pick your track, then narrow by section — class, coding language or engineering branch — and
        by subject. Every document opens in a new page.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setCategory(key);
              setSectionId("");
              setSubjectId("");
            }}
            className={[
              "rounded-full border px-5 py-2 text-sm font-medium transition-all",
              category === key
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
            ].join(" ")}
          >
            {CATEGORY_LABEL[key]}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSectionId("");
            setSubjectId("");
          }}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs transition-colors",
            sectionId === ""
              ? "border-primary/60 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          All sections
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSectionId(s.id);
              setSubjectId("");
            }}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              sectionId === s.id
                ? "border-primary/60 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {s.name}
          </button>
        ))}
      </div>

      {sectionId && subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubjectId("")}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              subjectId === ""
                ? "border-violet/60 text-violet"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            All subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubjectId(s.id)}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                subjectId === s.id
                  ? "border-violet/60 text-violet"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {s.name}
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
          <MaterialCard
            key={m.id}
            material={m}
            isAdmin={isAdmin}
            onOpenFile={openFile}
            onDelete={() => remove.mutate(m.id)}
            onSaved={() => qc.invalidateQueries({ queryKey: ["materials", category] })}
          />
        ))}
      </div>
    </div>
  );
}

type Material = {
  id: string;
  title: string;
  description: string | null;
  class_level: string | null;
  subject: string | null;
  file_path: string | null;
  external_url: string | null;
};

function MaterialCard({
  material,
  isAdmin,
  onOpenFile,
  onDelete,
  onSaved,
}: {
  material: Material;
  isAdmin: boolean;
  onOpenFile: (path: string) => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: material.title,
    description: material.description ?? "",
    subject: material.subject ?? "",
    external_url: material.external_url ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("study_materials")
        .update({
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          subject: draft.subject.trim() || null,
          external_url: draft.external_url.trim() || null,
        })
        .eq("id", material.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      toast.success("Material updated.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className="glass-card flex h-full flex-col p-6">
      <span className="inline-flex w-fit rounded-lg bg-primary/15 p-2.5 text-primary">
        <FileText className="h-4 w-4" />
      </span>

      {editing ? (
        <div className="mt-4 space-y-2">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Input
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            placeholder="Subject"
          />
          <Input
            value={draft.external_url}
            onChange={(e) => setDraft({ ...draft, external_url: e.target.value })}
            placeholder="External link"
          />
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
        </div>
      ) : (
        <>
          <h2 className="mt-4 text-lg font-semibold">{material.title}</h2>
          <p className="mt-1 text-xs tracking-wider text-primary uppercase">
            {[material.class_level ? `Class ${material.class_level}` : null, material.subject]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">{material.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {material.file_path && (
              <Button size="sm" onClick={() => onOpenFile(material.file_path!)} className="gap-1.5">
                <Download className="h-4 w-4" /> Open document
              </Button>
            )}
            {material.external_url && (
              <a href={material.external_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" /> Open link
                </Button>
              </a>
            )}
          </div>
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
                onClick={onDelete}
                className="flex items-center gap-1.5 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
