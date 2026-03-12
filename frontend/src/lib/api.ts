const API_BASE = "/api";

export async function streamRequest(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone?: () => void,
  onError?: (err: string) => void
) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      onError?.(err || `HTTP ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError?.("No response body");
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
    onDone?.();
  } catch (err) {
    onError?.(String(err));
  }
}

export async function getRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
