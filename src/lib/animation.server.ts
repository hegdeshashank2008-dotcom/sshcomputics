const GATEWAY = "https://ai.gateway.lovable.dev/v1/videos";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI gateway key is not configured.");
  return key;
}

export function buildPrompt(topic: string, level: string) {
  return [
    `An educational 3D animated explainer video about "${topic}" for ${level || "school"} students.`,
    "Cinematic camera slowly orbits 360 degrees around clean, labelled 3D diagrams and models of the concept,",
    "showing each part step by step with glowing highlights, arrows and simple on-screen labels.",
    "Bright studio lighting, dark navy background, crisp science-documentary style, calm narration voice explaining the concept clearly in English.",
  ].join(" ");
}

export async function createVideoJob(prompt: string) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/veo-3.1-lite",
      prompt,
      seconds: "8",
      size: "1280x720",
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    if (res.status === 402) {
      throw new Error(
        "AI video credits are exhausted, so a new animation can't be rendered right now. Use the free animated lessons below or ask the admin to top up credits.",
      );
    }
    throw new Error(err?.message ?? `Video generation failed (${res.status}).`);
  }

  return (await res.json()) as { id: string; status: string };
}

export async function readVideoJob(id: string) {
  const res = await fetch(`${GATEWAY}/${id}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) throw new Error(`Could not read the video job (${res.status}).`);
  return (await res.json()) as {
    id: string;
    status: string;
    progress?: number;
    error?: { code?: string; message?: string };
  };
}

export async function downloadVideo(id: string) {
  const res = await fetch(`${GATEWAY}/${id}/content`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) throw new Error(`Could not download the generated video (${res.status}).`);
  return await res.arrayBuffer();
}
