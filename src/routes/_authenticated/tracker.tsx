import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, Plus, Trash2, Trophy, Maximize2, Play, Pause, RotateCcw, Quote, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Study Tracker & Time Management | Shashank Computics" },
      {
        name: "description",
        content:
          "Plan study tasks by subject, log your study minutes, review weekly totals and see your saved quiz attempts in one personal dashboard.",
      },
      { property: "og:title", content: "Study Tracker | Shashank Computics" },
      {
        property: "og:description",
        content: "Plan tasks, log minutes and track your quiz progress week by week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackerPage,
});

function TrackerPage() {
  const { user, username } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(30);
  const [logSubject, setLogSubject] = useState("");
  const [logMinutes, setLogMinutes] = useState(45);

  const tasks = useQuery({
    queryKey: ["study_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sessions = useQuery({
    queryKey: ["study_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .order("studied_on", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const attempts = useQuery({
    queryKey: ["quiz_attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const addTask = useMutation({
    mutationFn: async () => {
      if (!user || !title.trim()) throw new Error("Add a task title first.");
      const { error } = await supabase.from("study_tasks").insert({
        user_id: user.id,
        title: title.trim(),
        subject: subject.trim() || null,
        duration_min: duration,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setSubject("");
      qc.invalidateQueries({ queryKey: ["study_tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("study_tasks").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study_tasks"] }),
  });

  const removeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study_tasks"] }),
  });

  const logSession = useMutation({
    mutationFn: async () => {
      if (!user || !logSubject.trim()) throw new Error("Enter a subject to log.");
      const { error } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        subject: logSubject.trim(),
        minutes: logMinutes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setLogSubject("");
      toast.success("Study session logged.");
      qc.invalidateQueries({ queryKey: ["study_sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const weekAgo = Date.now() - 7 * 864e5;
  const weekMinutes = (sessions.data ?? [])
    .filter((s) => new Date(s.studied_on).getTime() >= weekAgo)
    .reduce((n, s) => n + s.minutes, 0);
  const done = (tasks.data ?? []).filter((t) => t.completed).length;

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold md:text-5xl">
        Hi {username ?? "student"}, here's your <span className="text-gradient">tracker</span>
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">This week</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {Math.floor(weekMinutes / 60)}h {weekMinutes % 60}m
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">Tasks completed</p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {done}/{tasks.data?.length ?? 0}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">Quiz attempts</p>
          <p className="mt-1 text-3xl font-bold text-primary">{attempts.data?.length ?? 0}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-6">
          <h2 className="text-xl font-semibold">Study plan</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="sm:w-32"
            />
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="sm:w-20"
            />
          </div>
          <Button size="sm" className="mt-3 gap-1.5" onClick={() => addTask.mutate()}>
            <Plus className="h-4 w-4" /> Add task
          </Button>

          <ul className="mt-5 space-y-2">
            {(tasks.data ?? []).map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => toggleTask.mutate({ id: t.id, completed: !t.completed })}
                  className="text-primary"
                  aria-label="Toggle complete"
                >
                  {t.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <span className={t.completed ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
                  {t.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t.subject} · {t.duration_min}m
                  </span>
                </span>
                <button type="button" onClick={() => removeTask.mutate(t.id)} aria-label="Delete task">
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-6">
          <h2 className="text-xl font-semibold">Log study time</h2>
          <div className="mt-4 flex gap-2">
            <Input
              value={logSubject}
              onChange={(e) => setLogSubject(e.target.value)}
              placeholder="Subject studied"
            />
            <Input
              type="number"
              value={logMinutes}
              onChange={(e) => setLogMinutes(Number(e.target.value))}
              className="w-24"
            />
            <Button size="sm" className="gap-1.5" onClick={() => logSession.mutate()}>
              <Clock className="h-4 w-4" /> Log
            </Button>
          </div>

          <ul className="mt-5 space-y-2">
            {(sessions.data ?? []).slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
              >
                <span>{s.subject}</span>
                <span className="text-muted-foreground">
                  {s.minutes}m · {new Date(s.studied_on).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-4 w-4 text-primary" /> Recent quizzes
          </h3>
          <ul className="mt-3 space-y-2">
            {(attempts.data ?? []).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
              >
                <span>{a.topic}</span>
                <span className="text-primary">
                  {a.score}/{a.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
