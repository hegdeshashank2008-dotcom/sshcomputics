import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      topic: string;
      lesson: string;
      classLevel: string;
      difficulty: string;
      count: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { requestQuestions } = await import("./quiz.server");
    const questions = await requestQuestions({
      topic: data.topic,
      lesson: data.lesson,
      classLevel: data.classLevel,
      difficulty: data.difficulty,
      count: Math.min(Math.max(data.count, 1), 20),
    });
    return { questions };
  });

export const getQuizSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { loadQuizSettings } = await import("./quiz.server");
    const settings = await loadQuizSettings();
    return { ...settings, api_key: settings.api_key ? "********" : "" };
  });

export const saveQuizSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      provider: string;
      model: string;
      endpoint: string;
      api_key: string;
      system_prompt: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { loadQuizSettings } = await import("./quiz.server");
    const current = await loadQuizSettings();
    const next = {
      provider: data.provider,
      model: data.model,
      endpoint: data.endpoint,
      system_prompt: data.system_prompt,
      api_key: data.api_key === "********" ? current.api_key : data.api_key,
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "quiz", value: next }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
