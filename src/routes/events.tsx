import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, ExternalLink, MapPin, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Upcoming Quizzes & Hackathons for Students | Shashank Computics" },
      {
        name: "description",
        content:
          "A live calendar of upcoming quizzes, olympiads, coding contests and national hackathons that school and engineering students can enter.",
      },
      { property: "og:title", content: "Upcoming Quizzes & Hackathons | Shashank Computics" },
      {
        property: "og:description",
        content: "Track contest dates, eligibility and registration links in one calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

type EventRow = {
  id: string;
  title: string;
  event_type: string;
  organizer: string | null;
  starts_at: string;
  mode: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
};

const EMPTY_EVENT = {
  title: "",
  event_type: "quiz",
  organizer: "",
  starts_at: "",
  mode: "Online",
  location: "",
  url: "",
  description: "",
};

function EventsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY_EVENT });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim() || !draft.starts_at) throw new Error("Title and date are required.");
      const { error } = await supabase.from("events").insert({
        title: draft.title.trim(),
        event_type: draft.event_type,
        organizer: draft.organizer.trim() || null,
        starts_at: new Date(draft.starts_at).toISOString(),
        mode: draft.mode.trim() || null,
        location: draft.location.trim() || null,
        url: draft.url.trim() || null,
        description: draft.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ ...EMPTY_EVENT });
      setAdding(false);
      toast.success("Event added.");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quizzes = events.filter((e) => e.event_type === "quiz");
  const hackathons = events.filter((e) => e.event_type !== "quiz");

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold md:text-5xl">
        Upcoming <span className="text-gradient">Quizzes & Hackathons</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Competitions worth your weekend — olympiads, coding contests and hackathons with open
        registration.
      </p>

      {isAdmin && (
        <div className="mt-6">
          <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)} className="gap-1.5">
            <Plus className="h-4 w-4" /> {adding ? "Close" : "Add event"}
          </Button>
          {adding && (
            <div className="glass-card mt-4 grid gap-3 p-6 md:grid-cols-3">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Title"
              />
              <select
                value={draft.event_type}
                onChange={(e) => setDraft({ ...draft, event_type: e.target.value })}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="quiz">Quiz / Olympiad</option>
                <option value="hackathon">Hackathon / Contest</option>
              </select>
              <Input
                type="datetime-local"
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              />
              <Input
                value={draft.organizer}
                onChange={(e) => setDraft({ ...draft, organizer: e.target.value })}
                placeholder="Organizer"
              />
              <Input
                value={draft.mode}
                onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
                placeholder="Mode (Online / Offline)"
              />
              <Input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Location"
              />
              <Input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="Registration link"
                className="md:col-span-2"
              />
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="md:col-span-3"
              />
              <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-fit">
                Publish event
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading && <p className="mt-10 text-muted-foreground">Loading events…</p>}

      {[
        ["Quizzes & Olympiads", quizzes] as const,
        ["Hackathons & Contests", hackathons] as const,
      ].map(([label, list]) =>
        list.length === 0 ? null : (
          <section key={label} className="mt-12">
            <h2 className="text-2xl font-semibold">{label}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((e) => (
                <EventCard key={e.id} event={e} isAdmin={isAdmin} />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

function EventCard({ event, isAdmin }: { event: EventRow; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: event.title,
    organizer: event.organizer ?? "",
    starts_at: event.starts_at.slice(0, 16),
    mode: event.mode ?? "",
    location: event.location ?? "",
    url: event.url ?? "",
    description: event.description ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({
          title: draft.title.trim(),
          organizer: draft.organizer.trim() || null,
          starts_at: new Date(draft.starts_at).toISOString(),
          mode: draft.mode.trim() || null,
          location: draft.location.trim() || null,
          url: draft.url.trim() || null,
          description: draft.description.trim() || null,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      toast.success("Event updated.");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event deleted.");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing) {
    return (
      <article className="glass-card space-y-2 p-6">
        <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Input
          type="datetime-local"
          value={draft.starts_at}
          onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
        />
        <Input
          value={draft.organizer}
          onChange={(e) => setDraft({ ...draft, organizer: e.target.value })}
          placeholder="Organizer"
        />
        <Input
          value={draft.mode}
          onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
          placeholder="Mode"
        />
        <Input
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          placeholder="Location"
        />
        <Input
          value={draft.url}
          onChange={(e) => setDraft({ ...draft, url: e.target.value })}
          placeholder="Registration link"
        />
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
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
      <span className="inline-flex w-fit rounded-lg bg-primary/15 p-2.5 text-primary">
        <CalendarClock className="h-4 w-4" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{event.title}</h3>
      <p className="mt-1 text-xs tracking-wider text-primary uppercase">
        {new Date(event.starts_at).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{event.description}</p>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> {event.location ?? "Online"} · {event.mode ?? "Online"} ·{" "}
        {event.organizer ?? "Open"}
      </p>
      {event.url && (
        <a href={event.url} target="_blank" rel="noopener noreferrer" className="mt-4">
          <Button size="sm" className="gap-1.5">
            Register <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      )}
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
