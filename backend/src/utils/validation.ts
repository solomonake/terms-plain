export function isEmpty(text: string | undefined | null): boolean {
  if (!text) {
    return true;
  }

  return text.trim().length === 0;
}

export function isValidText(text: string | undefined | null): boolean {
  return !isEmpty(text);
}
