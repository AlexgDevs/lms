import type { AssistantAskRequestSchema } from "@/client";

export const ASSISTANT_ATTEMPT_THRESHOLD = 3;

/**
 * Streams a free-form question to the AI assistant over SSE and feeds the
 * plain-text deltas to `onDelta`. Resolves when the stream ends.
 */
export async function streamAssistantAsk(
  body: AssistantAskRequestSchema,
  onDelta: (delta: string) => void,
): Promise<void> {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/ai/assistant/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail =
      data && typeof data.detail === "string" ? data.detail : `Ошибка (${response.status})`;
    throw new Error(detail);
  }
  if (!response.body) {
    throw new Error("Стрим недоступен");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const fail = (message: string): Promise<void> => {
    reader.cancel().catch(() => undefined);
    return Promise.reject(new Error(message));
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const lines = event.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as { delta?: string; error?: string };
          if (typeof parsed.delta === "string" && parsed.delta) {
            onDelta(parsed.delta);
          } else if (parsed.error) {
            return fail(parsed.error);
          }
        } catch {
          // ignore malformed frames
        }
      }
    }
  }
}