// Minimal URL sanitizer: allow http/https/relative, reject javascript: etc.
export const sanitizeUrl = (url?: string | null): string => {
  if (!url) return '#';
  try {
    const trimmed = String(url).trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
    return trimmed;
  } catch {
    return '#';
  }
};
