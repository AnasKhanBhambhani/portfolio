// classnames merge (clsx-lite): join truthy string/array/object class values.
type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean>;

export const cn = (...inputs: ClassValue[]): string => {
  const out: string[] = [];
  const walk = (val: ClassValue) => {
    if (!val) return;
    if (typeof val === 'string' || typeof val === 'number') {
      out.push(String(val));
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    } else if (typeof val === 'object') {
      for (const key in val) if ((val as Record<string, boolean>)[key]) out.push(key);
    }
  };
  inputs.forEach(walk);
  return out.join(' ');
};
