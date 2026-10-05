import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { fmt12 } from '../utils/time.js';

const clock = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function TeacherHome() {
  const { user } = useAuth();
  const { school } = useSchool();
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [status, setStatus] = useState({ holiday: null, onLeave: false, checkOutFrom: '14:00', checkOutOpen: false });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const day = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const timeOf = Object.fromEntries(school.periods.map((p) => [p.number, p]));

  const load = () =>
    Promise.all([api.get('/attendance/today'), api.get('/attendance/mine'), api.get('/assignments/mine'), api.get('/attendance/status')]).then(([t, h, a, s]) => {
      setToday(t.data); setHistory(h.data); setStatus(s.data);
      setPeriods(a.data.filter((x) => x.day === day).sort((x, y) => x.period - y.period));
    });
  useEffect(() => { load().catch((e) => setMsg({ bad: true, text: errMsg(e) })); }, []);
  // so the button flips from Check in to Check out at the cut-off without a refresh
  useEffect(() => {
    const id = setInterval(() => api.get('/attendance/status').then((r) => setStatus(r.data)).catch(() => {}), 60000);
    return () => clearInterval(id);
  }, []);

  const withLocation = (path, done) => {
    setMsg(null);
    if (!navigator.geolocation) return setMsg({ bad: true, text: 'This browser does not support location.' });
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await api.post(path, { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
          setMsg({ text: done });
          await load();
        } catch (e) { setMsg({ bad: true, text: errMsg(e) }); await load().catch(() => {}); }
        finally { setBusy(false); }
      },
      (err) => {
        setBusy(false);
        setMsg({ bad: true, text: err.code === 1 ? 'Location is off for this site. Turn it on in your browser settings, then try again.' : 'Could not get your location. Try again.' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // One button: "Check in" before the cut-off, "Check out" from the cut-off. Disabled whenever there is nothing to do.
  const at = fmt12(status.checkOutFrom);
  let action = null;
  if (!status.holiday && !status.onLeave) {
    if (!today) {
      action = status.checkOutOpen
        ? { label: 'Check out', disabled: true, hint: `Check-in closed at ${at}, and you did not check in today.` }
        : { label: 'Check in', run: () => withLocation('/attendance/check-in', 'You are checked in.'), hint: `Turn on location and check in once. Check-out opens at ${at}.` };
    } else if (today.checkOutAt) {
      action = { label: 'Checked out', disabled: true, hint: `Checked out at ${clock(today.checkOutAt)}. See you tomorrow.` };
    } else {
      action = status.checkOutOpen
        ? { label: 'Check out', run: () => withLocation('/attendance/check-out', 'You are checked out.'), hint: 'Turn on location, then check out.' }
        : { label: 'Check out', disabled: true, hint: `Check-out opens at ${at}.` };
    }
  }

  return (
    <section>
      <div className="page-head"><div><h1>Hello, {user.name}</h1><p className="sub">Your day at a glance</p></div></div>
      <div className="cols2">
        <div className="card">
          <h2>Today's attendance</h2>
          {today && <p>Checked in at {clock(today.checkInAt)} <span className={`badge ${today.status}`}>{today.status}</span>{today.checkOutAt && <> · Checked out at {clock(today.checkOutAt)}</>}</p>}
          {status.holiday && !today && <p className="msg ok">Today is a holiday: {status.holiday}. No check-in needed.</p>}
          {status.onLeave && !today && <p className="msg ok">You are on approved leave today.</p>}
          {action && (
            <>
              <p className="sub" style={{ margin: '.25rem 0 .75rem' }}>{action.hint}</p>
              <button onClick={action.run} disabled={action.disabled || busy}>{busy ? 'Finding you…' : action.label}</button>
            </>
          )}
          {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'}`} style={{ marginTop: '.75rem' }}>{msg.text}</p>}
        </div>

        <div className="card">
          <h2>Your periods today ({day})</h2>
          {status.holiday ? <p className="msg ok">No classes today: {status.holiday}.</p> : periods.length ? (
            <ul className="plain">
              {periods.map((p) => (
                <li key={p._id}>
                  <b>P{p.period}</b>{timeOf[p.period] && <span className="sub"> {fmt12(timeOf[p.period].start)} – {fmt12(timeOf[p.period].end)}</span>}
                  <br />{p.subject.name}, {p.class.name} {p.class.section}
                </li>
              ))}
            </ul>
          ) : <p className="empty">No periods assigned today.</p>}
        </div>
      </div>

      <h2 className="section-title">Recent attendance</h2>
      <div className="scroll">
        <table>
          <thead><tr><th>Date</th><th>Checked in</th><th>Checked out</th><th>Status</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h._id}>
                <td>{h.date}</td><td>{clock(h.checkInAt)}</td><td>{h.checkOutAt ? clock(h.checkOutAt) : '–'}</td>
                <td><span className={`badge ${h.status}`}>{h.status}</span></td>
              </tr>
            ))}
            {!history.length && <tr><td colSpan="4" className="empty">No check-ins yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
