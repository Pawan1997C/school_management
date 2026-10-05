// Photo if there is one, otherwise a coloured circle with first-name + surname initials.
const PALETTE = [['#e0e7ff', '#3730a3'], ['#dcfce7', '#166534'], ['#fef3c7', '#92400e'], ['#fee2e2', '#991b1b'],
  ['#cffafe', '#155e75'], ['#fae8ff', '#86198f'], ['#ffedd5', '#9a3412'], ['#e0f2fe', '#075985']];
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Avatar({ name = '', url, size = 38 }) {
  if (url) return <img className="avatar" style={{ width: size, height: size }} src={url} alt="" />;
  const [bg, fg] = PALETTE[hash(name) % PALETTE.length];
  return <span className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.4 }} aria-hidden="true">{initialsOf(name)}</span>;
}
