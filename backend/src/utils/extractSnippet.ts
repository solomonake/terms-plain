function ensurePrefixEllipsis(value: string): string {
  if (value.startsWith("...")) {
    return value;
  }
  return `...${value}`;
}

function ensureSuffixEllipsis(value: string): string {
  if (value.endsWith("...")) {
    return value;
  }
  return `${value}...`;
}

export function extractSnippet(
  originalText: string,
  matchStart: number,
  matchEnd: number
): string {
  const desiredLen = 260;
  const textLen = originalText.length;
  let windowStart = Math.max(0, matchStart - 120);
  let windowEnd = Math.min(textLen, windowStart + desiredLen);

  if (windowEnd === textLen) {
    windowStart = Math.max(0, textLen - desiredLen);
  }

  let snippet = originalText.slice(windowStart, windowEnd).trim();

  if (windowStart > 0) {
    snippet = ensurePrefixEllipsis(snippet);
  }
  if (windowEnd < textLen) {
    snippet = ensureSuffixEllipsis(snippet);
  }

  if (snippet.length > 300) {
    snippet = snippet.slice(0, 300).trim();
    snippet = ensureSuffixEllipsis(snippet);
  }

  return snippet;
}
