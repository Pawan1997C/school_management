import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

const Field = ({ label, full, children }) => <label className={`field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>;

function ImagePick({ label, hint, current, onFile, removed, onRemove, fileKey }) {
  return (
    <div className="field full">
      <span>{label}</span>
      <div className="logo-edit">
        {current && !removed && <img className="site-thumb" src={current} alt="Current" />}
        <div>
          <input key={fileKey} type="file" accept="image/*" onChange={(e) => onFile(e.target.files[0] || null)} />
          {current && (
            <label className="chip" style={{ marginTop: '.5rem' }}><input type="checkbox" checked={removed} onChange={(e) => onRemove(e.target.checked)} />Remove current image</label>
          )}
        </div>
      </div>
      {hint && <span className="sub">{hint}</span>}
    </div>
  );
}

export default function AdminSite() {
  const [c, setC] = useState(null);
  const [files, setFiles] = useState({});
  const [removed, setRemoved] = useState({});
  const [fileKey, setFileKey] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/site').then((r) => setC(r.data)).catch((e) => setMsg({ bad: true, text: errMsg(e) })); }, []);
  if (!c) return msg ? <p className="msg bad">{msg.text}</p> : <p className="sub">Loading…</p>;

  const set = (sec, key, v) => setC((x) => ({ ...x, [sec]: { ...x[sec], [key]: v } }));
  const bind = (sec, key) => ({ value: c[sec]?.[key] ?? '', onChange: (e) => set(sec, key, e.target.value) });
  const setStat = (i, k, v) => setC((x) => ({ ...x, stats: x.stats.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
  const flag = (path) => ({ removed: !!removed[path], onRemove: (on) => setRemoved((r) => ({ ...r, [path]: on })) });

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('content', JSON.stringify({ ...c, remove: Object.keys(removed).filter((k) => removed[k]) }));
      Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
      const { data } = await api.put('/site', fd);
      setC(data); setFiles({}); setRemoved({}); setFileKey((k) => k + 1);
      setMsg({ text: 'Website updated. Visitors see the changes now.' });
    } catch (err) { setMsg({ bad: true, text: errMsg(err) }); }
    finally { setBusy(false); }
  };

  return (
    <section className="settings-wrap">
      <div className="page-head">
        <div><h1>Website content</h1><p className="sub">Everything on the public website. Gallery, news and faculty are managed on their own pages.</p></div>
        <a className="btn ghost" href="/" target="_blank" rel="noreferrer">View website</a>
      </div>
      <form onSubmit={save}>
        <div className="card">
          <h2>Home page banner</h2>
          <div className="form cols">
            <Field label="Headline" full><input maxLength={120} {...bind('hero', 'headline')} /></Field>
            <Field label="Sub-headline" full><textarea maxLength={300} {...bind('hero', 'subheadline')} /></Field>
            <Field label="Button text"><input maxLength={40} {...bind('hero', 'ctaText')} /></Field>
            <Field label="Button link (e.g. /contact or https://...)"><input {...bind('hero', 'ctaLink')} /></Field>
            <ImagePick label="Banner image" hint="Wide photos work best (max 5 MB). Without one, a blue gradient is used." current={c.hero?.image?.url} onFile={(f) => setFiles((x) => ({ ...x, heroImage: f }))} fileKey={fileKey} {...flag('hero.image')} />
          </div>
        </div>

        <div className="card">
          <h2>Numbers strip</h2>
          <p className="sub" style={{ marginBottom: '.75rem' }}>Up to 6 highlights shown under the banner, such as "1200+ Students".</p>
          {c.stats.map((s, i) => (
            <div key={i} className="form cols" style={{ marginBottom: '.5rem' }}>
              <input placeholder="Value (e.g. 25+)" value={s.value} maxLength={20} onChange={(e) => setStat(i, 'value', e.target.value)} aria-label={`Highlight ${i + 1} value`} />
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input placeholder="Label (e.g. Years of excellence)" value={s.label} maxLength={40} onChange={(e) => setStat(i, 'label', e.target.value)} aria-label={`Highlight ${i + 1} label`} />
                <button type="button" className="danger sm" onClick={() => setC((x) => ({ ...x, stats: x.stats.filter((_, j) => j !== i) }))}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="ghost sm" disabled={c.stats.length >= 6} onClick={() => setC((x) => ({ ...x, stats: [...x.stats, { label: '', value: '' }] }))}>Add highlight</button>
        </div>

        <div className="card">
          <h2>About us</h2>
          <div className="form cols">
            <Field label="Title" full><input maxLength={120} {...bind('about', 'title')} /></Field>
            <Field label="Description (leave a blank line between paragraphs)" full><textarea rows={7} maxLength={5000} {...bind('about', 'body')} /></Field>
            <Field label="Our mission" full><textarea maxLength={300} {...bind('about', 'mission')} /></Field>
            <Field label="Our vision" full><textarea maxLength={300} {...bind('about', 'vision')} /></Field>
            <ImagePick label="About image" current={c.about?.image?.url} onFile={(f) => setFiles((x) => ({ ...x, aboutImage: f }))} fileKey={fileKey} {...flag('about.image')} />
          </div>
        </div>

        <div className="card">
          <h2>Principal's message</h2>
          <div className="form cols">
            <Field label="Name"><input maxLength={80} {...bind('principal', 'name')} /></Field>
            <Field label="Title"><input maxLength={80} {...bind('principal', 'title')} /></Field>
            <Field label="Message" full><textarea rows={5} maxLength={5000} {...bind('principal', 'message')} /></Field>
            <ImagePick label="Photo" current={c.principal?.photo?.url} onFile={(f) => setFiles((x) => ({ ...x, principalPhoto: f }))} fileKey={fileKey} {...flag('principal.photo')} />
          </div>
        </div>

        <div className="card">
          <h2>Admissions banner</h2>
          <div className="form cols">
            <div className="field full"><label className="chip"><input type="checkbox" checked={!!c.admissions?.open} onChange={(e) => set('admissions', 'open', e.target.checked)} />Admissions are open (show the banner)</label></div>
            <Field label="Headline" full><input maxLength={120} {...bind('admissions', 'headline')} /></Field>
            <Field label="Text" full><textarea maxLength={300} {...bind('admissions', 'text')} /></Field>
          </div>
        </div>

        <div className="card">
          <h2>Contact details and map</h2>
          <div className="form cols">
            <Field label="Address" full><textarea maxLength={300} {...bind('contact', 'address')} /></Field>
            <Field label="Phone"><input {...bind('contact', 'phone')} /></Field>
            <Field label="Email"><input type="email" {...bind('contact', 'email')} /></Field>
            <Field label="Office hours" full><input {...bind('contact', 'hours')} /></Field>
            <Field label="Map latitude (optional)"><input type="number" step="any" {...bind('contact', 'lat')} /></Field>
            <Field label="Map longitude (optional)"><input type="number" step="any" {...bind('contact', 'lng')} /></Field>
            <p className="sub full">Leave the coordinates empty to use the school location set in Settings. The contact page shows a live, zoomable map of that spot.</p>
          </div>
        </div>

        <div className="card">
          <h2>Social media and footer</h2>
          <div className="form cols">
            <Field label="Facebook link"><input placeholder="https://" {...bind('social', 'facebook')} /></Field>
            <Field label="Instagram link"><input placeholder="https://" {...bind('social', 'instagram')} /></Field>
            <Field label="YouTube link"><input placeholder="https://" {...bind('social', 'youtube')} /></Field>
            <Field label="X (Twitter) link"><input placeholder="https://" {...bind('social', 'x')} /></Field>
            <Field label="Footer tagline" full><input maxLength={200} value={c.footerText ?? ''} onChange={(e) => setC({ ...c, footerText: e.target.value })} /></Field>
          </div>
        </div>

        <div className="savebar">
          <span className={msg ? (msg.bad ? 'field-err' : 'sub') : 'sub'}>{msg ? msg.text : 'Changes go live when you save.'}</span>
          <button disabled={busy}>{busy ? 'Saving…' : 'Save website'}</button>
        </div>
      </form>
    </section>
  );
}
