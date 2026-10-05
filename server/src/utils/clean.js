// Only plain http(s) links (and optionally site-relative paths) may be stored, so a saved link can never run script.
export const cleanUrl = (v, allowRelative = false) => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\/[^\s]+$/i.test(s)) return s;
  if (allowRelative && /^\/(?!\/)[^\s]*$/.test(s)) return s;
  return null;
};
