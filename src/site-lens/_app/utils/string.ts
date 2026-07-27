// Truncate a string to `maxLength`, appending an ellipsis when cut.
export const addEllipsis = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength))}…`;
};
