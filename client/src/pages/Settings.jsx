import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useSchool } from '../context/SchoolContext.jsx';
import Avatar from '../components/Avatar.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const plus = (t, mins) => {
  const [h, m] = t.split(':').map(Number);
  const x = Math.min(h * 60 + m + mins, 23 * 60 + 59);
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
};

export default function Settings() {
  const { refresh } = useSchool();
  const [f, setF] = useState({ schoolName: '', lat: '', lng: '', radiusMeters: 150, lateAfter: '09:00', checkOutFrom: '14:00', timezone: 'Asia/Kolkata', passPercent: 33 });
  const [periods, setPeriods] = useState([]);
  const [off, setOff] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logo, setLogo] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const apply = (s) => {
    setF({ schoolName: s.schoolName, lat: s.school?.lat ?? '', lng: s.school?.lng ?? '', radiusMeters: s.radiusMeters, lateAfter: s.lateAfter, checkOutFrom: s.checkOutFrom ?? '14:00', timezone: s.timezone, passPercent: s.passPercent ?? 33 });
    setPeriods(s.periods.map((p) => ({ start: p.start, end: p.end })));
    setOff(s.weeklyOff || []);
    setLogoUrl(s.logo?.url || null);
  };
  useEffect(() => { api.get('/settings').then(({ data }) => apply(data)).catch((e) => setMsg({ bad: true, text: errMsg(e) })); }, []);

  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const setPeriod = (i, k, v) => setPeriods((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const addPeriod = () => setPeriods((ps) => {
    const last = ps[ps.length - 1];
    const start = last ? last.end : '08:30';
    return [...ps, { start, end: plus(start, 45) }];
  });

  const useHere = () =>
    navigator.geolocation.getCurrentPosition(
      (p) => setF((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })),
      () => setMsg({ bad: true, text: 'Could not read your location. Turn on location for this site.' }),
      { enableHighAccuracy: true }
    );

  const save = async (e) => {
    e.preventDefault(); setMsg(null); setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      fd.append('weeklyOff', JSON.stringify(off));
      fd.append('periods', JSON.stringify(periods));
      if (logo) fd.append('logo', logo);
      if (removeLogo) fd.append('removeLogo', 'true');
      const { data } = await api.put('/settings', fd);
      apply(data); setLogo(null); setRemoveLogo(false); setFileKey((k) => k + 1);
      await refresh();
      setMsg({ text: 'Settings saved' });
    } catch (err) { setMsg({ bad: true, text: errMsg(err) }); }
    finally { setBusy(false); }
  };

  return (
    <section className="settings-wrap">
      <div className="page-head"><div><h1>Settings</h1><p className="sub">School profile, period timings, holidays and attendance rules.</p></div></div>
      <form onSubmit={save}>
        <div className="card">
          <h2>School profile</h2>
          <div className="form cols">
            <label className="field full"><span>School name</span><input required {...bind('schoolName')} /></label>
            <div className="field full">
              <span>School logo</span>
              <div className="logo-edit">
                {logoUrl && !removeLogo ? <img className="logo-preview" src={logoUrl} alt="Current logo" /> : <Avatar name={f.schoolName} size={56} />}
                <div>
                  <input key={fileKey} type="file" accept="image/*" onChange={(e) => { setLogo(e.target.files[0]); setRemoveLogo(false); }} />
                  {logoUrl && !logo && (
                    <label className="chip" style={{ marginTop: '.5rem' }}><input type="checkbox" checked={removeLogo} onChange={(e) => setRemoveLogo(e.target.checked)} />Remove current logo</label>
                  )}
                </div>
              </div>
              <span className="sub">Shown in the sidebar. A square image works best (max 2 MB).</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Period timings</h2>
          <p className="sub" style={{ marginBottom: '.75rem' }}>These times appear in the timetable and on teachers' home page. Gaps between periods act as breaks.</p>
          <div className="scroll">
            <table className="periods-edit">
              <thead><tr><th>Period</th><th>Starts</th><th>Ends</th></tr></thead>
              <tbody>
                {periods.map((p, i) => (
                  <tr key={i}>
                    <td><b>P{i + 1}</b></td>
                    <td><input type="time" required value={p.start} onChange={(e) => setPeriod(i, 'start', e.target.value)} aria-label={`Period ${i + 1} start`} /></td>
                    <td><input type="time" required value={p.end} onChange={(e) => setPeriod(i, 'end', e.target.value)} aria-label={`Period ${i + 1} end`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: '.75rem' }}>
            <button type="button" className="ghost sm" onClick={addPeriod} disabled={periods.length >= 12}>Add period</button>
            <button type="button" className="ghost sm" onClick={() => setPeriods((ps) => ps.slice(0, -1))} disabled={periods.length <= 1}>Remove last period</button>
          </div>
        </div>

        <div className="card">
          <h2>Working days</h2>
          <p className="sub" style={{ marginBottom: '.6rem' }}>Weekly off days. Attendance is not expected on these days. Specific holidays are managed on the Holidays page.</p>
          <div className="days-pick">
            {DAYS.map((d) => (
              <label key={d} className="chip"><input type="checkbox" checked={off.includes(d)} onChange={(e) => setOff((o) => (e.target.checked ? [...o, d] : o.filter((x) => x !== d)))} />{d} off</label>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Teacher check-in and exams</h2>
          <div className="form cols">
            <label className="field"><span>School latitude</span><input type="number" step="any" {...bind('lat')} /></label>
            <label className="field"><span>School longitude</span><input type="number" step="any" {...bind('lng')} /></label>
            <div className="full"><button type="button" className="ghost" onClick={useHere}>Use my current location</button></div>
            <label className="field"><span>Allowed distance (metres)</span><input type="number" min="20" required {...bind('radiusMeters')} /></label>
            <label className="field"><span>Late after</span><input type="time" required {...bind('lateAfter')} /></label>
            <label className="field"><span>Check-in closes / check-out opens at</span><input type="time" required {...bind('checkOutFrom')} /></label>
            <label className="field"><span>School timezone</span><input required {...bind('timezone')} /></label>
            <label className="field"><span>Pass mark (% of maximum)</span><input type="number" min="1" max="100" required {...bind('passPercent')} /></label>
          </div>
        </div>

        {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'}`} style={{ marginBottom: '1rem' }}>{msg.text}</p>}
        <button disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </form>
    </section>
  );
}
