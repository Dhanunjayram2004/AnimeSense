function toBase64Png(canvas) {
  // PNG preserves crisp sketch edges for AI
  return canvas.toDataURL("image/png");
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Sends the canvas sketch to an AI API and returns a ghost overlay image URL.
 *
 * Configure via VITE_AI_API_URL.
 *
 * Expected responses:
 * - JSON: { ghostLinesBase64: "data:image/png;base64,..." }
 * - OR: raw image/png response body
 */
export async function getGhostOverlayFromAI(canvas) {
  const apiUrl = import.meta.env?.VITE_AI_API_URL;
  if (!apiUrl) return null;

  const imageBase64 = toBase64Png(canvas);

  const res = await fetchWithTimeout(
    apiUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    },
    15000
  );

  if (!res.ok) {
    return null;
  }

  const contentType = res.headers.get("content-type") || "";

  // JSON response
  if (contentType.includes("application/json")) {
    const data = await res.json();
    const ghost = data?.ghostLinesBase64;
    if (typeof ghost === "string" && ghost.startsWith("data:image")) {
      return { type: "image", imageUrl: ghost };
    }
    return null;
  }

  // Raw image response
  if (contentType.includes("image/")) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { type: "image", imageUrl: url, revoke: () => URL.revokeObjectURL(url) };
  }

  return null;
}

