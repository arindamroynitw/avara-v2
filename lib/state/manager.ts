import { createClient } from "@/lib/supabase/server";
import {
  type ConversationState,
  createInitialState,
} from "@/lib/types/conversation";

export async function loadConversationState(
  userId: string
): Promise<ConversationState> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversation_state")
    .select("state")
    .eq("user_id", userId)
    .single();

  if (data?.state) {
    return data.state as ConversationState;
  }

  // Initialize if not found
  return initializeState(userId);
}

export async function saveConversationState(
  userId: string,
  state: ConversationState
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("conversation_state")
    .upsert(
      {
        user_id: userId,
        state: state as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
}

export async function initializeState(
  userId: string
): Promise<ConversationState> {
  const supabase = await createClient();
  const initialState = createInitialState();

  // Create conversation_state row
  await supabase.from("conversation_state").upsert(
    {
      user_id: userId,
      state: initialState as unknown as Record<string, unknown>,
      summary: "",
      message_count: 0,
    },
    { onConflict: "user_id" }
  );

  // Create empty financial_profiles row
  await supabase.from("financial_profiles").upsert(
    { user_id: userId },
    { onConflict: "user_id" }
  );

  return initialState;
}

export async function incrementMessageCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversation_state")
    .select("message_count")
    .eq("user_id", userId)
    .single();

  const newCount = (data?.message_count || 0) + 1;

  await supabase
    .from("conversation_state")
    .update({ message_count: newCount })
    .eq("user_id", userId);

  return newCount;
}

export async function saveSummary(
  userId: string,
  summary: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("conversation_state")
    .update({ summary })
    .eq("user_id", userId);
}

export async function loadSummary(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversation_state")
    .select("summary")
    .eq("user_id", userId)
    .single();

  return data?.summary || "";
}
