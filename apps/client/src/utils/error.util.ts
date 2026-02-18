/**
 * Parses and formats error messages from the backend.
 * Handles both JSON strings containing error arrays and plain strings.
 *
 * @param error - The error object or message to parse
 * @param fallback - Fallback message if no specific error is found
 * @returns A formatted error string, typically using newlines for multiple errors
 */
export function formatErrorMessage(
  error: any,
  fallback = "Сталася помилка"
): string {
  if (!error) return fallback;

  // apiFetch throws an Error where message is the raw response text (often JSON)
  const message = error.message || String(error);

  try {
    const parsed = JSON.parse(message);

    if (parsed.message) {
      if (Array.isArray(parsed.message)) {
        // If it's an array of validation errors, join them with newlines
        // and ensure each starts with a capital letter if not already
        return parsed.message
          .map((msg: string) => {
            const trimmed = msg.trim();
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          })
          .join("\n");
      }
      return parsed.message;
    }
  } catch {
    // If not valid JSON, just return the message or fallback
    return message !== "[object Object]" ? message : fallback;
  }

  return fallback;
}
