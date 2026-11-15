// True for anything that is not usable text: a missing value, a blank
// string, or a value of another type (number, boolean, array, object).
// Request bodies come from the network, so the value is not trusted to be a
// string, and other types are rejected here instead of being converted.
export function isEmpty(text: unknown): boolean {
  return typeof text !== "string" || text.trim().length === 0;
}

export function isValidText(text: unknown): text is string {
  return !isEmpty(text);
}
