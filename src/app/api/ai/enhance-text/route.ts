import { NextResponse } from "next/server";
import { normalizeAIError } from "@/lib/ai/gemini";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { enhanceText } from "@/lib/ai/service";
import { enhanceTextInputSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const guard = checkAIRateLimit(`${data.user.id}:enhance-text`);
  if (!guard.allowed) {
    return NextResponse.json({ error: "Too many AI requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(guard.retryAfterSeconds) } });
  }

  const parsed = enhanceTextInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const inputSnapshot = {
      text: parsed.data.text.slice(0, 4000),
      context: parsed.data.context,
      language: parsed.data.language,
    };
    const { output, model } = await enhanceText(inputSnapshot);
    await supabase.from("ai_reports").insert({
      project_id: null,
      type: "enhance_text",
      input_snapshot: inputSnapshot,
      output,
      model,
      created_by: data.user.id,
    });
    return NextResponse.json(output);
  } catch (aiError) {
    return NextResponse.json({ error: normalizeAIError(aiError) }, { status: 502 });
  }
}
