import { createClient } from "@/lib/supabase/server";
import { loadAllMessages } from "@/lib/state/messages";
import type { UIMessage } from "ai";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dbMessages = await loadAllMessages(user.id);

  // Convert DB messages to UIMessage format
  const uiMessages: UIMessage[] = dbMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
    // Include rich component data from metadata if present
    ...(msg.metadata &&
      typeof msg.metadata === "object" &&
      "components" in msg.metadata &&
      Array.isArray((msg.metadata as Record<string, unknown>).components)
      ? {
          // Append data parts for any stored component injections
          parts: [
            { type: "text" as const, text: msg.content },
            ...((msg.metadata as Record<string, unknown[]>).components || []).map(
              (comp: unknown) => {
                const c = comp as { type: string; data: unknown };
                return {
                  type: `data-${c.type}` as `data-${string}`,
                  data: c.data,
                };
              }
            ),
          ],
        }
      : {}),
  }));

  return Response.json(uiMessages);
}
