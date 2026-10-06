import { THEMES } from '../utils/themes.js';

// Radio cards with a tiny mock-up of the theme. kind: 'site' | 'admin'
export default function ThemePicker({ kind, label, value, onChange }) {
  return (
    <fieldset className="theme-picker">
      <legend>{label}</legend>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <label key={t.id} className={`theme-card ${value === t.id ? 'on' : ''}`}>
            <input type="radio" name={`theme-${kind}`} value={t.id} checked={value === t.id} onChange={() => onChange(t.id)} />
            {kind === 'site' ? (
              <span className="mock-site" style={{ background: t.site.soft }} aria-hidden="true">
                <i style={{ background: t.site.navy }} />
                <b style={{ background: `linear-gradient(120deg, ${t.site.navy}, ${t.site.blue})` }}><u style={{ background: t.site.gold }} /></b>
              </span>
            ) : (
              <span className="mock-admin" aria-hidden="true">
                <i style={{ background: t.admin.side }}><u style={{ background: t.admin.primary }} /></i>
                <b style={{ background: '#f3f5f9' }}><u style={{ background: t.admin.primary }} /><s style={{ background: t.admin.primarySoft }} /></b>
              </span>
            )}
            <span className="theme-name">{t.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
