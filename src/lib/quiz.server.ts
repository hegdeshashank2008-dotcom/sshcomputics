export type QuizSettings = {
  provider: "lovable" | "custom";
  model: string;
  endpoint: string;
  api_key: string;
  system_prompt: string;
};

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  provider: "lovable",
  model: "google/gemini-2.5-flash",
  endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
  api_key: "",
  system_prompt:
    "You are a strict exam question setter for Indian school and engineering students. Generate accurate multiple-choice questions on exactly the topic requested.",
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string | undefined;
};

export async function loadQuizSettings(): Promise<QuizSettings> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "quiz")
    .maybeSingle();
  const stored = (data?.value ?? {}) as Partial<QuizSettings>;
  return { ...DEFAULT_QUIZ_SETTINGS, ...stored };
}

export async function requestQuestions(input: {
  topic: string;
  lesson: string;
  classLevel: string;
  difficulty: string;
  count: number;
}): Promise<QuizQuestion[]> {
  const settings = await loadQuizSettings();
  const key = settings.api_key || process.env["LOVABLE_API_KEY"] || "";
  if (!key) throw new Error("Quiz API key is not configured.");

  const focus = [input.lesson.trim(), input.topic.trim()].filter(Boolean).join(" — ");
  const prompt = `Create ${input.count} multiple-choice questions for a ${input.classLevel} student.
Lesson: ${input.lesson.trim() || "not specified"}
Topic (must be followed exactly): ${input.topic.trim()}
Difficulty: ${input.difficulty}

Every question must be strictly about "${focus}". Each question has exactly 4 distinct options and one correct answer that appears verbatim in the options.
Reply with JSON only in this shape:
{"questions":[{"question":"...","options":["a","b","c","d"],"correct_answer":"a","explanation":"..."}]}`;

  const res = await fetch(settings.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: "system", content: settings.system_prompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("Too many quiz requests right now — try again shortly.");
  if (res.status === 402) throw new Error("Quiz AI credits are exhausted. Add credits to continue.");
  if (!res.ok) throw new Error(`Quiz provider error (${res.status}).`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: { questions?: QuizQuestion[] };
  try {
    parsed = JSON.parse(cleaned) as { questions?: QuizQuestion[] };
  } catch {
    throw new Error("The quiz provider returned an unreadable response. Try again.");
  }

  const questions = (parsed.questions ?? [])
    .filter((q) => q?.question && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({
      question: String(q.question),
      options: q.options.map(String),
      correct_answer: String(q.correct_answer),
      explanation: q.explanation ? String(q.explanation) : undefined,
    }))
    .filter((q) => q.options.includes(q.correct_answer));

  if (questions.length === 0) throw new Error("No questions could be generated for that topic.");
  return questions;
}
