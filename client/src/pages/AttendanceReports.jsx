import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Avatar from '../components/Avatar.jsx';

const thisMonth = () => new Date().toLocaleDateString('en-CA').slice(0, 7);
const label = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString([], { month: 'long', year: 'numeric' });
const pc = (v) => (v == null ? '–' : `${v}%`);
const pts = (v) => (v == null ? '–' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} pts`);
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function Change({ v }) {
  if (v == null) return <span className="badge pending">–</span>;
  return <span className={`badge ${v > 0 ? 'present' : v < 0 ? 'absent' : 'pending'}`}>{v > 0 ? '▲' : v < 0 ? '▼' : '='} {pts(v)}</span>;
}

export default function AttendanceReports() {
  const [type, setType] = useState('teachers');
  const [month, setMonth] = useState(thisMonth());
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/classes').then((r) => setClasses(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!month) return;
    setLoading(true); setError('');
    api.get('/reports/attendance', { params: { type, month, ...(type === 'students' && classId ? { classId } : {}) } })
      .then((r) => setData(r.data)).catch((e) => { setData(null); setError(errMsg(e)); }).finally(() => setLoading(false));
  }, [type, month, classId]);

  const T = type === 'teachers';
  const cur = label(month);
  const prevLabel = data ? label(data.prevMonth) : '';

  const download = () => {
    const head = T
      ? ['Teacher', 'Days present', 'Of which late', 'Leave days', 'Absent days', 'Working days', `Attendance % (${cur})`, `Absent days (${prevLabel})`, `Attendance % (${prevLabel})`, 'Change (pts)']
      : ['Student', 'Roll no', 'Class', 'Days present', 'Of which late', 'Absent days', 'Days marked', `Attendance % (${cur})`, `Absent days (${prevLabel})`, `Attendance % (${prevLabel})`, 'Change (pts)'];
    const body = data.rows.map((r) => (T
      ? [r.name, r.present, r.late, r.leave, r.absent, r.days, r.percent, r.prev.absent, r.prev.percent, r.change]
      : [r.name, r.rollNo, r.class, r.present, r.late, r.absent, r.days, r.percent, r.prev.absent, r.prev.percent, r.change]));
    const sm = data.summary;
    const total = T
      ? ['Overall', sm.cur.attended, '', sm.cur.leave, sm.cur.absent, '', sm.cur.percent, sm.prev.absent, sm.prev.percent, sm.change]
      : ['Overall', '', '', sm.cur.attended, '', sm.cur.absent, '', sm.cur.percent, sm.prev.absent, sm.prev.percent, sm.change];
    const csv = '\uFEFF' + [head, ...body, total].map((row) => row.map(esc).join(',')).join('\r\n');
    const cls = type === 'students' && classId ? `-${classes.find((c) => c._id === classId)?.name}-${classes.find((c) => c._id === classId)?.section}` : '';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${type}-attendance-${month}${cls.replace(/\s+/g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const sm = data?.summary;
  return (
    <section>
      <div className="page-head">
        <div><h1>Monthly attendance report</h1><p className="sub">{cur}, compared with {data ? prevLabel : 'the previous month'}</p></div>
        <div className="row no-print">
          <button className="ghost" onClick={() => window.print()} disabled={!data}>Print / save as PDF</button>
          <button onClick={download} disabled={!data || !data.rows.length}>Download CSV</button>
        </div>
      </div>

      <div className="no-print">
        <div className="tabs">
          <button className={T ? '' : 'ghost'} onClick={() => setType('teachers')}>Teachers</button>
          <button className={T ? 'ghost' : ''} onClick={() => setType('students')}>Students</button>
        </div>
        <div className="filters">
          <label className="field"><span>Month</span><input type="month" max={thisMonth()} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></label>
          {!T && (
            <label className="field"><span>Class</span>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
              </select></label>
          )}
        </div>
      </div>

      {error && <p className="msg bad">{error}</p>}
      {loading && !data && <p className="sub">Loading report…</p>}
      {data && (
        <>
          <div className="stats">
            <div className="stat"><b>{pc(sm.cur.percent)}</b><span>Attendance, {cur}</span></div>
            <div className="stat"><b>{pc(sm.prev.percent)}</b><span>Attendance, {prevLabel}</span></div>
            <div className="stat"><b><Change v={sm.change} /></b><span>Change from last month</span></div>
            <div className="stat"><b>{sm.cur.absent}</b><span>Absent days (was {sm.prev.absent})</span></div>
            {T ? <div className="stat"><b>{sm.workingDays}</b><span>Working days (was {sm.prevWorkingDays})</span></div>
              : <div className="stat"><b>{data.rows.length}</b><span>Students in report</span></div>}
          </div>

          <div className="scroll">
            <table>
              <thead>
                {T ? (
                  <tr><th>Teacher</th><th>Present</th><th>Late</th><th>Leave</th><th>Absent</th><th>Working days</th><th>Attendance</th><th>Prev. absent</th><th>Prev. %</th><th>Change</th></tr>
                ) : (
                  <tr><th>Student</th><th>Class</th><th>Present</th><th>Late</th><th>Absent</th><th>Days marked</th><th>Attendance</th><th>Prev. absent</th><th>Prev. %</th><th>Change</th></tr>
                )}
              </thead>
              <tbody>
                {data.rows.map((r) => (T ? (
                  <tr key={r.id}>
                    <td><span className="who-cell"><Avatar name={r.name} url={r.photo} size={30} />{r.name}</span></td>
                    <td>{r.present}</td><td>{r.late}</td><td>{r.leave}</td><td>{r.absent}</td><td>{r.days}</td>
                    <td><b>{pc(r.percent)}</b></td><td>{r.prev.absent}</td><td>{pc(r.prev.percent)}</td><td><Change v={r.change} /></td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td>{r.name} <span className="sub">#{r.rollNo}</span></td><td>{r.class}</td>
                    <td>{r.present}</td><td>{r.late}</td><td>{r.absent}</td><td>{r.days}</td>
                    <td><b>{pc(r.percent)}</b></td><td>{r.prev.absent}</td><td>{pc(r.prev.percent)}</td><td><Change v={r.change} /></td>
                  </tr>
                )))}
                {!data.rows.length && <tr><td colSpan="10" className="empty">{T ? 'No teachers yet.' : 'No students found.'}</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ marginTop: '.75rem' }}>
            {T
              ? `Working days exclude weekly offs and holidays. "Present" includes late days. Approved leave days are shown separately and left out of the percentage.${data.countedThrough ? ` The current month is counted up to ${data.countedThrough}.` : ''}`
              : 'Based on the class registers teachers have saved. "Present" includes late days, and days with no register are not counted.'}
          </p>
        </>
      )}
    </section>
  );
}
