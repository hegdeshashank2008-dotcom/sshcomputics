import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CLASSES = [
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
  "Engineering",
];

/** Open Trivia DB categories, grouped as school-friendly topics. */
const TOPICS = [
  { label: "General Knowledge", category: 9 },
  { label: "Science & Nature", category: 17 },
  { label: "Computers & Coding", category: 18 },
  { label: "Mathematics", category: 19 },
  { label: "Mythology", category: 20 },
  { label: "Sports", category: 21 },
  { label: "Geography", category: 22 },
  { label: "History", category: 23 },
  { label: "Politics & Civics", category: 24 },
  { label: "Art", category: 25 },
  { label: "Animals", category: 27 },
  { label: "Gadgets", category: 30 },
];

type Question = {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  options: string[];
};

const decode = (s: string) => {
  const el = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (!el) return s;
  el.innerHTML = s;
  return el.value;
};

const shuffle = <T,>(arr: T[]) => arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Generator by Class, Topic & Lesson | Shashank Computics" },
      {
        name: "description",
        content:
          "Generate an instant practice quiz by choosing your class, topic, lesson and difficulty. Live questions, instant scoring and saved attempt history.",
      },
      { property: "og:title", content: "Instant Quiz Generator | Shashank Computics" },
      {
        property: "og:description",
        content: "Practise with fresh questions tailored to your class, topic and difficulty level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { user } = useAuth();
  const [classLevel, setClassLevel] = useState("Class 10");
  const [topic, setTopic] = useState(TOPICS[2]!.label);
  const [lesson, setLesson] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [count, setCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    setLoading(true);
    setQuestions(null);
    setAnswers({});
    setSubmitted(false);
    try {
      const cat = TOPICS.find((t) => t.label === topic)?.category ?? 9;
      const res = await fetch(
        `https://opentdb.com/api.php?amount=${count}&category=${cat}&difficulty=${difficulty}&type=multiple`,
      );
      const json = (await res.json()) as { response_code: number; results: Question[] };
      if (json.response_code !== 0 || !json.results?.length) {
        toast.error("Not enough questions for that combination — try another topic or difficulty.");
        return;
      }
      setQuestions(
        json.results.map((q) => ({
          ...q,
          question: decode(q.question),
          correct_answer: decode(q.correct_answer),
          incorrect_answers: q.incorrect_answers.map(decode),
          options: shuffle([q.correct_answer, ...q.incorrect_answers].map(decode)),
        })),
      );
    } catch {
      toast.error("Could not reach the question bank. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const score = questions
    ? questions.reduce((n, q, i) => (answers[i] === q.correct_answer ? n + 1 : n), 0)
    : 0;

  const submit = async () => {
    if (!questions) return;
    setSubmitted(true);
    const total = questions.length;
    const finalScore = questions.reduce(
      (n, q, i) => (answers[i] === q.correct_answer ? n + 1 : n),
      0,
    );
    if (user) {
      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        class_level: classLevel,
        topic: lesson.trim() ? `${topic} — ${lesson.trim()}` : topic,
        score: finalScore,
        total,
      });
    }
  };

  return (
    <div className="section-shell pt-28 pb-24">
      <h1 className="text-4xl font-bold md:text-5xl">
        Quiz <span className="text-gradient">Generator</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Choose your class, topic and lesson — we pull fresh questions from a live open question
        bank and score you instantly. Signed-in students get their attempts saved to the tracker.
      </p>

      <div className="glass-card mt-8 grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="text-muted-foreground">Class / course</span>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
          >
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
          >
            {TOPICS.map((t) => (
              <option key={t.label}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Lesson (optional)</span>
          <Input
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            placeholder="e.g. Loops"
            className="mt-1"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Questions</span>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button onClick={generate} disabled={loading} className="mt-5 gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Generate quiz
      </Button>

      {questions && (
        <div className="mt-10 space-y-5">
          {questions.map((q, i) => (
            <article key={i} className="glass-card p-6">
              <p className="font-medium">
                {i + 1}. {q.question}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const chosen = answers[i] === opt;
                  const correct = submitted && opt === q.correct_answer;
                  const wrong = submitted && chosen && opt !== q.correct_answer;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                      className={[
                        "rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
                        correct
                          ? "border-primary bg-primary/20 text-primary"
                          : wrong
                            ? "border-destructive bg-destructive/15 text-destructive"
                            : chosen
                              ? "border-primary/60 bg-primary/10"
                              : "border-border bg-surface hover:border-primary/40",
                      ].join(" ")}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}

          {!submitted ? (
            <Button onClick={submit} size="lg">
              Submit answers
            </Button>
          ) : (
            <div className="glass-card flex items-center gap-4 p-6">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {score} / {questions.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user
                    ? "Saved to your study tracker."
                    : "Sign in to save your attempts and track progress."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
