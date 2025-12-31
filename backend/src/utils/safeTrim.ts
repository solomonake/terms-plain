export function safeTrim(text: string, maxChars: number): string {
  if (!text) {
    return "";
  }

  const trimmed = text.trim();

  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return trimmed.slice(0, maxChars);
}
