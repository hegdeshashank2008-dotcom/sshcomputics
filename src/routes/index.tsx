import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Code2,
  GraduationCap,
  Trophy,
  Timer,
  Sparkles,
  ArrowRight,
  Building2,
  CalendarClock,
  Library,
  Quote,
} from "lucide-react";
import logo from "@/assets/shashank-logo.png.asset.json";
import { Button } from "@/components/ui/button";

const QUOTES = [
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Learning never exhausts the mind — it fuels it.", author: "Leonardo da Vinci" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Code is like humour. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Class 1–12 Materials",
    body: "Notes, textbooks and worksheets organised class-wise and subject-wise, uploaded and verified by the Shashank Computics team.",
    to: "/materials" as const,
  },
  {
    icon: Code2,
    title: "Coding Library",
    body: "Python, C++, DSA and full-stack web resources with curated roadmaps for absolute beginners to placement-ready coders.",
    to: "/materials" as const,
  },
  {
    icon: GraduationCap,
    title: "Engineering Vault",
    body: "GATE-grade engineering mathematics, electronics, mechanical and CS material sourced from NPTEL and MIT OCW.",
    to: "/materials" as const,
  },
  {
    icon: Timer,
    title: "Time & Study Tracker",
    body: "Plan tasks by class or course, log study minutes and watch your weekly consistency graph grow.",
    to: "/tracker" as const,
  },
  {
    icon: Trophy,
    title: "Quiz Generator",
    body: "Generate a fresh quiz by class, topic and lesson — powered by a live open question bank with instant scoring.",
    to: "/quiz" as const,
  },
  {
    icon: Building2,
    title: "Engineering Colleges",
    body: "Placement data by branch for top colleges, filtered by state and district, with honest student feedback and ratings.",
    to: "/colleges" as const,
  },
  {
    icon: CalendarClock,
    title: "Quizzes & Hackathons",
    body: "A live calendar of upcoming olympiads, coding contests and national hackathons you can actually enter.",
    to: "/events" as const,
  },
  {
    icon: Library,
    title: "Coding & Other Resources",
    body: "Hand-picked free platforms — freeCodeCamp, CS50, NPTEL, LeetCode and more — in one clean shelf.",
    to: "/resources" as const,
  },
];

const STATS = [
  { value: "1–12", label: "Classes covered" },
  { value: "20+", label: "Colleges with placement data" },
  { value: "100%", label: "Free for students" },
  { value: "24/7", label: "Available online" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shashank Computics — Study Materials, Quizzes & Coding for Students" },
      {
        name: "description",
        content:
          "Free study materials for Class 1-12, coding and engineering resources, a study tracker, quiz generator and engineering college placement data. Code. Create. Innovate.",
      },
      { property: "og:title", content: "Shashank Computics — Study Materials, Quizzes & Coding for Students" },
      {
        property: "og:description",
        content:
          "Free study materials for Class 1-12, coding and engineering resources, a study tracker, quiz generator and engineering college placement data. Code. Create. Innovate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const quote = useMemo(() => QUOTES[quoteIndex]!, [quoteIndex]);

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="section-shell pt-16 pb-20 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium tracking-widest text-primary uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Code · Create · Innovate
            </span>
            <h1 className="mt-6 text-4xl leading-[1.05] font-bold md:text-6xl">
              One learning home for <span className="text-gradient">every student</span> at
              Shashank Computics
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              From Class 1 worksheets to GATE-level engineering notes, from your first line of
              Python to an offer letter — Shashank Computics brings study material, tracking,
              quizzes, college insight and coding resources into a single free platform.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/materials">
                <Button size="lg" className="gap-2">
                  Explore study materials <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/quiz">
                <Button size="lg" variant="outline">
                  Generate a quiz
                </Button>
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="glass-card p-4">
                  <dt className="text-2xl font-bold text-primary">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="glass-card float-card-slow p-6">
              <img
                src={logo.url}
                alt="Shashank Computics — artificial intelligence, coding, databases and cloud computing"
                className="w-full rounded-xl"
              />
            </div>
            <div className="glass-card float-card absolute -bottom-8 -left-2 hidden max-w-[15rem] p-4 sm:block">
              <p className="text-xs tracking-wider text-muted-foreground uppercase">Today's streak</p>
              <p className="mt-1 text-2xl font-bold text-primary">Keep it alive</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Log study minutes in the tracker.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section-shell">
        <div className="glass-card relative overflow-hidden p-8 md:p-12">
          <Quote className="absolute -top-4 -left-2 h-28 w-28 text-primary/10" />
          <p className="relative text-xl leading-relaxed font-medium md:text-2xl">
            “{quote.text}”
          </p>
          <p className="relative mt-4 text-sm tracking-widest text-primary uppercase">
            — {quote.author}
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-shell pt-20">
        <h2 className="text-3xl font-bold md:text-4xl">
          Everything a student needs, <span className="text-gradient">in one place</span>
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Eight connected tools built around how students actually study — browse, plan, practise
          and decide.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Link key={f.title} to={f.to} className="block">
              <article
                className="glass-card h-full p-6"
                style={{ animationDelay: `${(i % 4) * 0.6}s` }}
              >
                <span className="inline-flex rounded-xl bg-primary/15 p-3 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="section-shell pt-20">
        <div className="glass-card grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-3xl font-bold">About Shashank Computics</h2>
            <p className="mt-4 text-muted-foreground">
              Shashank Computics is a student-first computer education initiative. We teach and
              share what actually matters: strong school fundamentals, real coding skill, and a
              clear-eyed view of engineering careers.
            </p>
            <p className="mt-4 text-muted-foreground">
              Every material on this platform is reviewed and published by the Shashank Computics
              admin team, so students always land on something worth their time.
            </p>
          </div>
          <ul className="grid gap-3 self-center">
            {[
              "Artificial Intelligence & Machine Learning foundations",
              "Coding and programming from Class 6 upwards",
              "Databases, algorithms and cloud computing",
              "Career and engineering-college guidance",
            ].map((item) => (
              <li
                key={item}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-primary/50"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
