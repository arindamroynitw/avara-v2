import { createClient } from "@/lib/supabase/server";

export interface DbMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string;
  metadata: Record<string, unknown>;
  chapter: number | null;
  created_at: string;
}

export async function saveMessage(
  userId: string,
  message: {
    role: string;
    content: string;
    messageType?: string;
    metadata?: Record<string, unknown>;
    chapter?: number;
  }
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: userId,
      role: message.role,
      content: message.content,
      message_type: message.messageType || "text",
      metadata: message.metadata || {},
      chapter: message.chapter || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save message:", error);
    throw error;
  }

  return data.id;
}

export async function loadRecentMessages(
  userId: string,
  limit: number = 20
): Promise<DbMessage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Reverse to get chronological order
  return (data || []).reverse() as DbMessage[];
}

export async function loadAllMessages(userId: string): Promise<DbMessage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data || []) as DbMessage[];
}

export async function getMessageCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return count || 0;
}
