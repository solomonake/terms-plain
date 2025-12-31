export function parsePossiblyFencedJson(raw: string): unknown {
  let s = raw.trim();

  if (s.startsWith("```")) {
    const lines = s.split("\n");
    lines.shift();
    if (lines.length && lines[lines.length - 1].trim() === "```") {
      lines.pop();
    }
    s = lines.join("\n").trim();
  }

  try {
    return JSON.parse(s);
  } catch {
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      s = s.slice(first, last + 1);
    }
  }

  try {
    return JSON.parse(s);
  } catch {
    throw new Error("Invalid JSON from Gemini");
  }
}
