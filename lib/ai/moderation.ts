/**
 * Lightweight pre-flight checks. This is abuse and cost control, not content
 * policing — the model provider runs its own safety systems, and a refusal
 * from it is surfaced to the user as a normal failure with a credit refund.
 */

export interface ModerationResult {
  ok: boolean;
  reason?: string;
}

/** Rejects input that is almost certainly a waste of a paid generation. */
export function checkInput(
  values: Record<string, string>,
  maxChars: number,
): ModerationResult {
  const combined = Object.values(values).join(" ");

  if (combined.trim().length === 0) {
    return { ok: false, reason: "Please fill in the required fields." };
  }

  if (combined.length > maxChars) {
    return {
      ok: false,
      reason: `Your input is ${combined.length.toLocaleString()} characters. The limit for this tool is ${maxChars.toLocaleString()}.`,
    };
  }

  // A single character repeated for pages is never a real request.
  for (const value of Object.values(values)) {
    if (value.length > 500 && /^(.)\1+$/.test(value.replace(/\s/g, ""))) {
      return { ok: false, reason: "That input doesn't look like real content." };
    }
  }

  return { ok: true };
}
