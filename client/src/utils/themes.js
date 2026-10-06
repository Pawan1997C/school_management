// Colour themes. Each one styles the public website (`site`) and the admin panel (`admin`).
// Keep the ids in sync with THEME_IDS in server/src/models/Settings.js.
export const THEMES = [
  { id: 'royal', name: 'Royal Blue',
    site: { navy: '#0f2747', navyDeep: '#0a1c36', blue: '#1d4e9e', gold: '#f2b134', goldLight: '#ffc552', goldDark: '#8a5a00', goldSoft: '#fff3d6', tint: '#dbe6f7', tint2: '#c3d6f3', blueSoft: '#e0ecff', soft: '#f5f7fb' },
    admin: { primary: '#4f46e5', primary600: '#4338ca', primaryDark: '#1e1b4b', primarySoft: '#eef2ff', primaryBorder: '#c7d2fe', side: '#111827', sideText: '#aab4c5' } },
  { id: 'emerald', name: 'Forest Green',
    site: { navy: '#0d3b2e', navyDeep: '#08291f', blue: '#1b7a57', gold: '#f5b83d', goldLight: '#ffca62', goldDark: '#8a5a00', goldSoft: '#fff3d6', tint: '#d9f0e6', tint2: '#bfe5d4', blueSoft: '#dff5ea', soft: '#f3f8f5' },
    admin: { primary: '#0b7a53', primary600: '#096544', primaryDark: '#06352a', primarySoft: '#e3f6ee', primaryBorder: '#b6e3cf', side: '#0b2a22', sideText: '#9fc4b6' } },
  { id: 'crimson', name: 'Maroon',
    site: { navy: '#5a1020', navyDeep: '#3e0a16', blue: '#a3213c', gold: '#f0b94a', goldLight: '#ffcd6b', goldDark: '#8a5a00', goldSoft: '#fff1d6', tint: '#f6dde2', tint2: '#efc5ce', blueSoft: '#fbe3e8', soft: '#fbf5f6' },
    admin: { primary: '#be123c', primary600: '#9f0f33', primaryDark: '#4c0519', primarySoft: '#ffe4ea', primaryBorder: '#fbb6c4', side: '#2a0d16', sideText: '#cfa9b3' } },
  { id: 'violet', name: 'Violet',
    site: { navy: '#2d1b5e', navyDeep: '#1e1142', blue: '#5b3fc4', gold: '#ff9f6b', goldLight: '#ffb68c', goldDark: '#a34410', goldSoft: '#ffe9dc', tint: '#e6e0f7', tint2: '#d3c9f0', blueSoft: '#ece7fb', soft: '#f7f5fc' },
    admin: { primary: '#7c3aed', primary600: '#6d28d9', primaryDark: '#2e1065', primarySoft: '#f1eaff', primaryBorder: '#d9c7fb', side: '#1c1033', sideText: '#b9a9d8' } },
  { id: 'ocean', name: 'Ocean Teal',
    site: { navy: '#0b3a4a', navyDeep: '#072a36', blue: '#0e7490', gold: '#f4c26b', goldLight: '#ffd58c', goldDark: '#7a5200', goldSoft: '#fff2d9', tint: '#d6eef3', tint2: '#bde2ea', blueSoft: '#def4f8', soft: '#f2f8fa' },
    admin: { primary: '#0e7490', primary600: '#0b5f76', primaryDark: '#083344', primarySoft: '#dff3f8', primaryBorder: '#aee0ec', side: '#0a2530', sideText: '#9fc0cb' } },
  { id: 'slate', name: 'Slate and Orange',
    site: { navy: '#1f2937', navyDeep: '#111827', blue: '#475569', gold: '#f97316', goldLight: '#fb923c', goldDark: '#a8480a', goldSoft: '#ffedd5', tint: '#e5e7eb', tint2: '#d1d5db', blueSoft: '#eef0f3', soft: '#f6f7f9' },
    admin: { primary: '#475569', primary600: '#334155', primaryDark: '#0f172a', primarySoft: '#eef1f5', primaryBorder: '#cbd5e1', side: '#111827', sideText: '#aab4c5' } },
];

const find = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`; };

// CSS variables for the public website (set as an inline style on the .site wrapper)
export const siteVars = (id) => {
  const s = find(id).site;
  return {
    '--navy': s.navy, '--navy-rgb': rgb(s.navy), '--navy-deep-rgb': rgb(s.navyDeep), '--blue': s.blue,
    '--gold': s.gold, '--gold-rgb': rgb(s.gold), '--gold-light': s.goldLight, '--gold-dark': s.goldDark, '--gold-soft': s.goldSoft,
    '--tint': s.tint, '--tint-2': s.tint2, '--blue-soft': s.blueSoft, '--soft': s.soft,
  };
};

export const adminVars = (id) => {
  const a = find(id).admin;
  return {
    '--primary': a.primary, '--primary-600': a.primary600, '--primary-dark': a.primaryDark, '--primary-soft': a.primarySoft,
    '--primary-border': a.primaryBorder, '--primary-rgb': rgb(a.primary), '--side': a.side, '--side-text': a.sideText,
  };
};

// Sets the admin-panel theme on the page. `persist` remembers it so the next visit does not flash the default colours.
export const applyAdminTheme = (id, { persist = false } = {}) => {
  const root = document.documentElement;
  Object.entries(adminVars(id)).forEach(([k, v]) => root.style.setProperty(k, v));
  if (persist) { try { localStorage.setItem('adminTheme', id); } catch { /* storage unavailable */ } }
};
export const clearAdminTheme = () => {
  Object.keys(adminVars('royal')).forEach((k) => document.documentElement.style.removeProperty(k));
};
