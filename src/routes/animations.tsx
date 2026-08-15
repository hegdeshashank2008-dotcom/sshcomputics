import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Film, Sparkles, Trash2, Upload, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Rotatable3D } from "@/components/Rotatable3D";
import { startAnimation, pollAnimation } from "@/lib/animation.functions";
import { LoginNotice } from "@/components/LoginNotice";

export const Route = createFileRoute("/animations")({
  head: () => ({
    meta: [
      { title: "Animated 3D Video Lessons on Any Topic | Shashank Computics" },
      {
        name: "description",
        content:
          "Type any topic and watch a fully animated 3D explainer video, explore a rotatable 360° diagram, and browse animated lessons uploaded by Shashank Computics.",
      },
      { property: "og:title", content: "Animated 3D Video Lessons | Shashank Computics" },
      {
        property: "og:description",
        content: "AI-generated animated explainer videos plus rotatable 3D diagrams for every topic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnimationsPage,
});

const LEVELS = [
  "Class 1-5",
  "Class 6-8",
  "Class 9-10",
  "Class 11-12",
  "Coding",
  "Engineering",
] as const;

type VideoRow = {
  id: string;
  topic: string;
  title: string;
  description: string | null;
  storage_path: string | null;
  external_url: string | null;
  source: string;
  created_at: string;
};

function AnimationsPage() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<string>(LEVELS[2]);
  const [search, setSearch] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const start = useServerFn(startAnimation);
  const poll = useServerFn(pollAnimation);
  const cancelled = useRef(false);

  useEffect(() => () => void (cancelled.current = true), []);

  const library = useQuery({
    queryKey: ["animation_videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animation_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VideoRow[];
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { jobId } = await start({ data: { topic, level } });
      setProgress(5);
      // Poll until the animation is rendered (usually 1-3 minutes).
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 7000));
        if (cancelled.current) return null;
        const res = await poll({ data: { jobId, topic, level } });
        if (res.status === "failed") throw new Error(res.message);
        if (res.status === "completed") return res.url;
        setProgress(Math.max(5, res.progress ?? 0));
      }
      throw new Error("The animation is taking longer than expected. Please try again.");
    },
    onSuccess: (url) => {
      setProgress(null);
      if (url) {
        setVideoUrl(url);
        qc.invalidateQueries({ queryKey: ["animation_videos"] });
        toast.success("Your animated lesson is ready.");
      }
    },
    onError: (e: Error) => {
      setProgress(null);
      toast.error(e.message);
    },
  });

  const openVideo = async (row: VideoRow) => {
    if (row.external_url) {
      window.open(row.external_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!row.storage_path) return;
    const { data, error } = await supabase.storage
      .from("animations")
      .createSignedUrl(row.storage_path, 3600);
    if (error || !data) {
      toast.error("Could not open this video.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const filtered = (library.data ?? []).filter((v) =>
    `${v.title} ${v.topic}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="section-shell pt-28 pb-24">
      <LoginNotice what="generating animated lessons" />
      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-widest text-primary">
          <Film className="h-3.5 w-3.5" /> Animated lessons
        </span>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">
          Learn any topic through <span className="text-gradient">3D animation</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Type a topic and we generate a narrated, fully animated explainer video, plus a 3D diagram
          you can grab and rotate a full 360°.
        </p>
      </header>

      <section className="glass-card mt-8 grid gap-4 p-6 md:grid-cols-[2fr_1fr_auto]">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Photosynthesis, Binary search tree, Otto cycle"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <Button
          onClick={() => {
            if (!user) {
              toast.error("Please sign in to generate an animated video.");
              return;
            }
            setVideoUrl(null);
            generate.mutate();
          }}
          disabled={generate.isPending || topic.trim().length < 3}
          className="gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          {generate.isPending ? "Animating…" : "Generate video"}
        </Button>
        {generate.isPending && (
          <p className="text-sm text-muted-foreground md:col-span-3">
            Rendering your animation ({progress ?? 0}%). This usually takes 1–3 minutes — keep this
            page open.
          </p>
        )}
      </section>

      {videoUrl && (
        <section className="glass-card mt-6 overflow-hidden p-4">
          <video src={videoUrl} controls autoPlay className="w-full rounded-xl" />
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Open in a new page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      )}

      {topic.trim().length >= 3 && (
        <section className="glass-card mt-6 p-6">
          <h2 className="text-lg font-semibold">Free animated lessons on “{topic.trim()}”</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand-picked animation sources — each opens in a new page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              {
                label: "YouTube animations",
                href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} 3d animation explained ${level}`)}`,
              },
              {
                label: "Khan Academy",
                href: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(topic)}`,
              },
              {
                label: "PhET simulations",
                href: `https://phet.colorado.edu/en/simulations/filter?q=${encodeURIComponent(topic)}`,
              },
            ].map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  {l.label} <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            ))}
          </div>
        </section>
      )}


      <div className="mt-8">
        <Rotatable3D topic={topic} />
      </div>

      {isAdmin && <AdminUpload />}

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Animation library</h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search animated lessons"
            className="max-w-xs"
          />
        </div>

        {library.isLoading ? (
          <p className="mt-6 text-muted-foreground">Loading animations…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No animated lessons yet.</p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <li key={v.id} className="glass-card flex flex-col gap-2 p-5">
                <span className="text-xs uppercase tracking-widest text-primary">
                  {v.source === "ai" ? "AI animated" : "Uploaded"} · {v.topic}
                </span>
                <h3 className="font-semibold">{v.title}</h3>
                {v.description && (
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Button size="sm" variant="outline" onClick={() => openVideo(v)} className="gap-1.5">
                    Watch <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  {isAdmin && <DeleteButton row={v} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DeleteButton({ row }: { row: VideoRow }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async () => {
      if (row.storage_path) {
        await supabase.storage.from("animations").remove([row.storage_path]);
      }
      const { error } = await supabase.from("animation_videos").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["animation_videos"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button size="sm" variant="ghost" onClick={() => del.mutate()} aria-label="Delete video">
      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
    </Button>
  );
}

function AdminUpload() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", topic: "", description: "", external_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !form.title.trim() || !form.topic.trim()) {
      toast.error("Title and topic are required.");
      return;
    }
    if (!file && !form.external_url.trim()) {
      toast.error("Upload a video file or paste a video link.");
      return;
    }
    setBusy(true);
    try {
      let storagePath: string | null = null;
      if (file) {
        const path = `admin/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error } = await supabase.storage.from("animations").upload(path, file, {
          contentType: file.type || "video/mp4",
        });
        if (error) throw error;
        storagePath = path;
      }
      const { error } = await supabase.from("animation_videos").insert({
        topic: form.topic.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        external_url: form.external_url.trim() || null,
        storage_path: storagePath,
        source: "admin",
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Animation published.");
      setForm({ title: "", topic: "", description: "", external_url: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["animation_videos"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-card mt-10 grid gap-4 p-6 md:grid-cols-2">
      <h2 className="text-xl font-bold md:col-span-2">Admin · upload an animation</h2>
      <Input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Video title"
      />
      <Input
        value={form.topic}
        onChange={(e) => setForm({ ...form, topic: e.target.value })}
        placeholder="Topic (e.g. Cell division)"
      />
      <Input
        value={form.external_url}
        onChange={(e) => setForm({ ...form, external_url: e.target.value })}
        placeholder="Video link (optional)"
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground"
      />
      <Textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Short description"
        rows={3}
        className="md:col-span-2"
      />
      <Button onClick={submit} disabled={busy} className="w-fit gap-1.5">
        <Upload className="h-4 w-4" /> Publish animation
      </Button>
    </section>
  );
}
