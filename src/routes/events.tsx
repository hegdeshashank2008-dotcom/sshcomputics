import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
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
                <article key={e.id} className="glass-card flex h-full flex-col p-6">
                  <span className="inline-flex w-fit rounded-lg bg-primary/15 p-2.5 text-primary">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{e.title}</h3>
                  <p className="mt-1 text-xs tracking-wider text-primary uppercase">
                    {new Date(e.starts_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{e.description}</p>
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {e.location ?? "Online"} · {e.mode ?? "Online"} · {e.organizer ?? "Open"}
                  </p>
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4"
                    >
                      <Button size="sm" className="gap-1.5">
                        Register <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
