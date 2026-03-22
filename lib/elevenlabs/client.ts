/**
 * Server-side ElevenLabs API helpers.
 * Uses plain fetch — no SDK needed server-side.
 */

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

function getHeaders() {
  return {
    "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    "Content-Type": "application/json",
  };
}

/**
 * Get a signed URL for WebRTC connection.
 * The client uses this with Conversation.startSession({ signedUrl })
 */
export async function getSignedUrl(): Promise<string> {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) throw new Error("ELEVENLABS_AGENT_ID not configured");

  const res = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get-signed-url?agent_id=${agentId}`,
    {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000), // C3: 10s timeout
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs signed URL error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.signed_url;
}

/**
 * Get conversation details including transcript after a call ends.
 */
export async function getConversationDetails(conversationId: string): Promise<{
  transcript: Array<{ role: string; message: string; timestamp?: number }>;
  metadata: Record<string, unknown>;
}> {
  const res = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
    { headers: getHeaders(), signal: AbortSignal.timeout(10000) }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs conversation error: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Extract transcript from the response
  const transcript = (data.transcript || []).map(
    (entry: { role: string; message: string; time_in_call_secs?: number }) => ({
      role: entry.role === "agent" ? "assistant" : "user",
      message: entry.message,
      timestamp: entry.time_in_call_secs,
    })
  );

  return { transcript, metadata: data.metadata || {} };
}
