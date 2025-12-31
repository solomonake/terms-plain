import { FLAG_DEFS } from "./flags";
import { extractSnippet } from "./utils/extractSnippet";
import type { Flag } from "./types";

export function detectFlags(text: string): Flag[] {
  const originalText = text;
  const lower = originalText.toLowerCase();
  const results: Flag[] = [];

  for (const def of FLAG_DEFS) {
    let bestKwStart = -1;
    let bestKwLen = 0;

    for (const keyword of def.keywords) {
      const kwLower = keyword.toLowerCase();
      const idx = lower.indexOf(kwLower);
      if (
        idx >= 0 &&
        (bestKwStart === -1 ||
          idx < bestKwStart ||
          (idx === bestKwStart && kwLower.length > bestKwLen))
      ) {
        bestKwStart = idx;
        bestKwLen = kwLower.length;
      }
    }

    let regexStart = -1;
    let regexEnd = -1;
    if (def.regex) {
      try {
        const re = new RegExp(def.regex, "i");
        const m = re.exec(originalText);
        if (m && typeof m.index === "number") {
          regexStart = m.index;
          regexEnd = regexStart + m[0].length;
        }
      } catch {
        // Ignore regex errors.
      }
    }

    if (bestKwStart === -1 && regexStart === -1) {
      continue;
    }

    let matchStart = -1;
    let matchEnd = -1;

    if (bestKwStart !== -1 && regexStart === -1) {
      matchStart = bestKwStart;
      matchEnd = bestKwStart + bestKwLen;
    } else if (bestKwStart === -1 && regexStart !== -1) {
      matchStart = regexStart;
      matchEnd = regexEnd;
    } else {
      const regexMuchEarlier = regexStart <= bestKwStart - 30;
      if (!regexMuchEarlier) {
        matchStart = bestKwStart;
        matchEnd = bestKwStart + bestKwLen;
      } else {
        matchStart = regexStart;
        matchEnd = regexEnd;
      }
    }

    const snippet = extractSnippet(originalText, matchStart, matchEnd);

    results.push({
      id: def.id,
      label: def.label,
      severity: def.severity,
      evidenceSnippet: snippet,
      whyItMatters: def.whyItMatters,
    });
  }

  return results;
}
