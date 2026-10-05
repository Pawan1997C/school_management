import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

const STATUSES = ['present', 'late', 'absent'];

// Teachers take and save the register; admin (readOnly) can look at any class and date.
export default function StudentAttendance({ readOnly = false }) {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const req = readOnly
      ? api.get('/classes').then((r) => r.data)
      : api.get('/assignments/mine').then((r) => [...new Map(r.data.map((a) => [a.class._id, a.class])).values()]);
    req.then((list) => { setClasses(list); if (list[0]) setClassId(list[0]._id); setLoaded(true); })
      .catch((e) => setMsg({ bad: true, text: errMsg(e) }));
  }, []);

  useEffect(() => {
    if (!classId) return;
    setMsg(null);
    api.get('/class-attendance', { params: { classId, ...(date ? { date } : {}) } })
      .then(({ data }) => { setRows(data.rows); setSaved(data.saved); if (!date) setDate(data.date); })
      .catch((e) => setMsg({ bad: true, text: errMsg(e) }));
  }, [classId, date]);

  const setStatus = (id, status) => setRows((rs) => rs.map((r) => (r.studentId === id ? { ...r, status } : r)));
  const count = (s) => rows.filter((r) => r.status === s).length;

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await api.put('/class-attendance', { classId, date, records: rows.map((r) => ({ student: r.studentId, status: r.status })) });
      setSaved(true); setMsg({ text: 'Attendance saved' });
    } catch (e) { setMsg({ bad: true, text: errMsg(e) }); }
    finally { setBusy(false); }
  };

  if (loaded && !classes.length)
    return <section><h1>Class attendance</h1><p className="empty">{readOnly ? 'Add classes first.' : 'You have no classes yet. Ask the admin to assign you in the timetable.'}</p></section>;

  return (
    <section>
      <h1>Class attendance</h1>
      <div className="row filters">
        <label className="field"><span>Class</span>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setDate(''); }}>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
          </select></label>
        <label className="field"><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      <p className="summary">
        {count('present')} present, {count('late')} late, {count('absent')} absent
        {!readOnly && !saved && ' (not saved yet, everyone starts as present)'}
        {readOnly && !saved && ' (no register taken for this date)'}
      </p>
      {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'}`}>{msg.text}</p>}
      <div className="scroll">
        <table>
          <thead><tr><th>Roll</th><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId}>
                <td>{r.rollNo}</td><td>{r.name}</td>
                <td>
                  {readOnly ? <span className={`badge ${r.status}`}>{r.status}</span> : (
                    <div className="seg">
                      {STATUSES.map((s) => (
                        <button key={s} type="button" className={`${r.status === s ? `on ${s}` : ''}`} aria-pressed={r.status === s} onClick={() => setStatus(r.studentId, s)}>{s}</button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="3" className="empty">No students in this class yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {!readOnly && rows.length > 0 && (
        <div className="row" style={{ marginTop: '1rem' }}>
          <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save attendance'}</button>
          <button className="ghost" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, status: 'present' })))}>Mark all present</button>
        </div>
      )}
    </section>
  );
}
