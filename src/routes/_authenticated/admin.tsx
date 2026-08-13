import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getQuizSettings, saveQuizSettings } from "@/lib/quiz.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Manage Content & Approvals | Shashank Computics" },
      {
        name: "description",
        content:
          "Shashank Computics admin control centre: upload study materials, manage sections and subjects, tune the quiz AI settings and approve student submissions.",
      },
      { property: "og:title", content: "Admin Panel | Shashank Computics" },
      { property: "og:description", content: "Restricted admin area for content and approvals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Materials", "Sections & subjects", "Quiz API", "Approvals"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("Materials");

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

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "rounded-full border px-4 py-2 text-sm transition-colors",
              tab === t
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "Materials" && <MaterialsTab />}
        {tab === "Sections & subjects" && <SectionsTab />}
        {tab === "Quiz API" && <QuizTab />}
        {tab === "Approvals" && <ApprovalsTab />}
      </div>
    </div>
  );
}

function MaterialsTab() {
  const { user } = useAuth();
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

  return (
    <>
      <section className="glass-card grid gap-4 p-6 md:grid-cols-2">
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
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
        <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" />
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
    </>
  );
}

function SectionsTab() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("school");
  const [sectionName, setSectionName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = useQuery({
    queryKey: ["material_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_sections")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const subjects = useQuery({
    queryKey: ["material_subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("material_subjects").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addSection = useMutation({
    mutationFn: async () => {
      if (!sectionName.trim()) throw new Error("Enter a section name.");
      const { error } = await supabase
        .from("material_sections")
        .insert({ category, name: sectionName.trim(), sort_order: (sections.data ?? []).length });
      if (error) throw error;
    },
    onSuccess: () => {
      setSectionName("");
      qc.invalidateQueries({ queryKey: ["material_sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material_sections"] });
      qc.invalidateQueries({ queryKey: ["material_subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubject = useMutation({
    mutationFn: async (sectionId: string) => {
      if (!subjectName.trim()) throw new Error("Enter a subject name.");
      const { error } = await supabase
        .from("material_subjects")
        .insert({ section_id: sectionId, name: subjectName.trim(), sort_order: 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubjectName("");
      qc.invalidateQueries({ queryKey: ["material_subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["material_subjects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <section className="glass-card flex flex-wrap items-center gap-3 p-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="school">Class 1–12</option>
          <option value="coding">Coding</option>
          <option value="engineering">Engineering</option>
        </select>
        <Input
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder="New section (e.g. Class 9 / Python / Mechanical)"
          className="max-w-xs"
        />
        <Button size="sm" className="gap-1.5" onClick={() => addSection.mutate()}>
          <Plus className="h-4 w-4" /> Add section
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {(sections.data ?? []).map((s) => {
          const subs = (subjects.data ?? []).filter((x) => x.section_id === s.id);
          return (
            <section key={s.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {s.name}
                  <span className="ml-2 text-xs text-muted-foreground uppercase">{s.category}</span>
                </h3>
                <button type="button" aria-label="Delete section" onClick={() => delSection.mutate(s.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              <ul className="mt-3 space-y-1.5">
                {subs.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {sub.name}
                    <button type="button" aria-label="Delete subject" onClick={() => delSubject.mutate(sub.id)}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Input
                  value={activeSection === s.id ? subjectName : ""}
                  onFocus={() => setActiveSection(s.id)}
                  onChange={(e) => {
                    setActiveSection(s.id);
                    setSubjectName(e.target.value);
                  }}
                  placeholder="New subject"
                />
                <Button size="sm" variant="outline" onClick={() => addSubject.mutate(s.id)}>
                  Add
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function QuizTab() {
  const [form, setForm] = useState({
    provider: "",
    model: "",
    endpoint: "",
    api_key: "",
    system_prompt: "",
  });
  const [loaded, setLoaded] = useState(false);

  useQuery({
    queryKey: ["quiz_settings"],
    queryFn: async () => {
      const s = await getQuizSettings();
      setForm({
        provider: s.provider ?? "",
        model: s.model ?? "",
        endpoint: s.endpoint ?? "",
        api_key: s.api_key ?? "",
        system_prompt: s.system_prompt ?? "",
      });
      setLoaded(true);
      return s;
    },
  });

  const save = useMutation({
    mutationFn: async () => saveQuizSettings({ data: form }),
    onSuccess: () => toast.success("Quiz settings saved."),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass-card grid gap-4 p-6 md:grid-cols-2">
      {!loaded && <p className="text-muted-foreground md:col-span-2">Loading settings…</p>}
      <Input
        value={form.provider}
        onChange={(e) => setForm({ ...form, provider: e.target.value })}
        placeholder="Provider (lovable / openai / custom)"
      />
      <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" />
      <Input
        value={form.endpoint}
        onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
        placeholder="API endpoint URL"
      />
      <Input
        value={form.api_key}
        onChange={(e) => setForm({ ...form, api_key: e.target.value })}
        placeholder="API key"
        type="password"
      />
      <Textarea
        value={form.system_prompt}
        onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
        placeholder="System prompt used for quiz generation"
        rows={5}
        className="md:col-span-2"
      />
      <Button className="w-fit" onClick={() => save.mutate()} disabled={save.isPending}>
        Save quiz settings
      </Button>
      <p className="text-xs text-muted-foreground md:col-span-2">
        Leave the key as ******** to keep the stored key unchanged.
      </p>
    </section>
  );
}

function ApprovalsTab() {
  const qc = useQueryClient();

  const colleges = useQuery({
    queryKey: ["pending_colleges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colleges")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stays = useQuery({
    queryKey: ["pending_stays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stay_reviews")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveCollege = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colleges").update({ approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending_colleges"] });
      qc.invalidateQueries({ queryKey: ["colleges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectCollege = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colleges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending_colleges"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const approveStay = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stay_reviews").update({ approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending_stays"] });
      qc.invalidateQueries({ queryKey: ["stay_reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectStay = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stay_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending_stays"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold">Student-added colleges</h2>
        {(colleges.data ?? []).length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Nothing waiting for approval.</p>
        )}
        <ul className="mt-4 space-y-2">
          {(colleges.data ?? []).map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {c.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.district}, {c.state}
                  </span>
                </span>
                <span className="flex gap-2">
                  <button type="button" aria-label="Approve" onClick={() => approveCollege.mutate(c.id)}>
                    <Check className="h-4 w-4 text-success" />
                  </button>
                  <button type="button" aria-label="Reject" onClick={() => rejectCollege.mutate(c.id)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold">Hostel & PG reviews</h2>
        {(stays.data ?? []).length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Nothing waiting for approval.</p>
        )}
        <ul className="mt-4 space-y-2">
          {(stays.data ?? []).map((s) => (
            <li key={s.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {s.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.city}, {s.district} · {s.stay_type} · {s.rating}★
                  </span>
                </span>
                <span className="flex gap-2">
                  <button type="button" aria-label="Approve" onClick={() => approveStay.mutate(s.id)}>
                    <Check className="h-4 w-4 text-success" />
                  </button>
                  <button type="button" aria-label="Reject" onClick={() => rejectStay.mutate(s.id)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </span>
              </div>
              {s.comment && <p className="mt-1 text-muted-foreground">{s.comment}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
