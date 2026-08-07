import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Upload Study Materials | Shashank Computics" },
      {
        name: "description",
        content:
          "Shashank Computics admin panel for uploading and managing study material files, links and content for class, coding and engineering tracks.",
      },
      { property: "og:title", content: "Admin Panel | Shashank Computics" },
      { property: "og:description", content: "Restricted admin area for content uploads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "school",
    class_level: "",
    subject: "",
    external_url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const materials = useQuery({
    queryKey: ["admin_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_materials"] }),
  });

  const upload = async () => {
    if (!user || !form.title.trim()) {
      toast.error("A title is required.");
      return;
    }
    setBusy(true);
    try {
      let filePath: string | null = null;
      if (file) {
        const path = `${form.category}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error } = await supabase.storage.from("materials").upload(path, file);
        if (error) throw error;
        filePath = path;
      }
      const { error } = await supabase.from("study_materials").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        class_level: form.class_level.trim() || null,
        subject: form.subject.trim() || null,
        external_url: form.external_url.trim() || null,
        file_path: filePath,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Material published.");
      setForm({ title: "", description: "", category: form.category, class_level: "", subject: "", external_url: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["admin_materials"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="section-shell pt-28">Checking access…</div>;
  if (!isAdmin)
    return (
      <div className="section-shell pt-28 pb-24">
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold">Admin access only</h1>
          <p className="mt-2 text-muted-foreground">
            This area is restricted to the Shashank Computics admin account.
          </p>
        </div>
      </div>
    );

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold">
        Admin <span className="text-gradient">Panel</span>
      </h1>

      <section className="glass-card mt-8 grid gap-4 p-6 md:grid-cols-2">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="school">Class 1–12</option>
          <option value="coding">Coding</option>
          <option value="engineering">Engineering</option>
        </select>
        <Input
          value={form.class_level}
          onChange={(e) => setForm({ ...form, class_level: e.target.value })}
          placeholder="Class level (e.g. 8)"
        />
        <Input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Subject"
        />
        <Input
          value={form.external_url}
          onChange={(e) => setForm({ ...form, external_url: e.target.value })}
          placeholder="External link (optional)"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground"
        />
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description"
          className="md:col-span-2"
          rows={3}
        />
        <Button onClick={upload} disabled={busy} className="w-fit gap-1.5">
          <Upload className="h-4 w-4" /> Publish material
        </Button>
      </section>

      <ul className="mt-8 space-y-2">
        {(materials.data ?? []).map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          >
            <span>
              {m.title}
              <span className="ml-2 text-xs text-muted-foreground">
                {m.category} {m.class_level ? `· Class ${m.class_level}` : ""}
              </span>
            </span>
            <button type="button" onClick={() => remove.mutate(m.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
