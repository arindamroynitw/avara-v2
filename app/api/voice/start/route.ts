import { createClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/elevenlabs/client";
import {
  loadConversationState,
  saveConversationState,
} from "@/lib/state/manager";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { triggerContext } = await req.json();

  try {
    // Get signed URL for WebRTC
    const signedUrl = await getSignedUrl();

    // Create voice session record
    const state = await loadConversationState(user.id);

    const { data: session, error } = await supabase
      .from("voice_sessions")
      .insert({
        user_id: user.id,
        status: "active",
        chapter_at_start: state.currentChapter,
        trigger_context: triggerContext || null,
      })
      .select("id")
      .single();

    if (error || !session) {
      throw new Error("Failed to create voice session");
    }

    // Update conversation state
    state.activeVoiceSession = session.id;
    await saveConversationState(user.id, state);

    return Response.json({
      signedUrl,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Voice start error:", err);
    return Response.json(
      {
        error: "Failed to start voice session",
        message:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
