import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startAnimation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { topic: string; level: string }) => input)
  .handler(async ({ data }) => {
    const topic = data.topic.trim();
    if (topic.length < 3) throw new Error("Please enter a topic with at least 3 characters.");
    const { buildPrompt, createVideoJob } = await import("./animation.server");
    const job = await createVideoJob(buildPrompt(topic, data.level));
    return { jobId: job.id, status: job.status };
  });

export const pollAnimation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string; topic: string; level: string }) => input)
  .handler(async ({ data, context }) => {
    const { readVideoJob, downloadVideo } = await import("./animation.server");
    const job = await readVideoJob(data.jobId);

    if (job.status === "failed") {
      return { status: "failed" as const, message: job.error?.message ?? "Video generation failed." };
    }
    if (job.status !== "completed") {
      return { status: "pending" as const, progress: job.progress ?? 0 };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `ai/${data.jobId}.mp4`;

    const { data: existing } = await supabaseAdmin
      .from("animation_videos")
      .select("id, storage_path")
      .eq("storage_path", path)
      .maybeSingle();

    if (!existing) {
      const bytes = await downloadVideo(data.jobId);
      const { error: upErr } = await supabaseAdmin.storage
        .from("animations")
        .upload(path, bytes, { contentType: "video/mp4", upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { error: insErr } = await supabaseAdmin.from("animation_videos").insert({
        topic: data.topic.trim(),
        title: `${data.topic.trim()} — animated explainer`,
        description: `AI-generated 3D animated lesson for ${data.level || "students"}.`,
        storage_path: path,
        source: "ai",
        status: "completed",
        created_by: context.userId,
      });
      if (insErr) throw new Error(insErr.message);
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("animations")
      .createSignedUrl(path, 3600);
    if (signErr) throw new Error(signErr.message);

    return { status: "completed" as const, url: signed.signedUrl };
  });
