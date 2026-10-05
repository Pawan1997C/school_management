import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import Icon from '../components/Icon.jsx';

const KPIS = [['teachers', 'Teachers', 'teachers', 'indigo'], ['students', 'Students', 'students', 'green'], ['classes', 'Classes', 'classes', 'amber'], ['subjects', 'Subjects', 'subjects', 'rose'], ['pendingLeaves', 'Pending leaves', 'leave', 'indigo']];

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/dashboard').then((r) => setD(r.data)).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <p className="msg bad">{error}</p>;
  if (!d) return <p className="sub">Loading dashboard…</p>;

  const t = d.teachersToday, tTotal = d.counts.teachers || 1;
  const s = d.studentsToday, sTotal = s.present + s.late + s.absent;
  const maxClass = Math.max(1, ...d.classSizes.map((c) => c.students));

  return (
    <section>
      <div className="page-head">
        <div><h1>Dashboard</h1><p className="sub">{new Date(`${d.date}T00:00`).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        <div className="row"><Link className="btn ghost" to="/admin/students">Add student</Link><Link className="btn" to="/admin/timetable">Open timetable</Link></div>
      </div>

      {d.holiday && <p className="msg ok" style={{ marginBottom: '1rem' }}>Today is a holiday: {d.holiday}</p>}

      <div className="kpis">
        {KPIS.map(([k, label, icon, tone]) => (
          <div key={k} className="kpi">
            <span className={`kpi-icon ${tone}`}><Icon name={icon} size={22} /></span>
            <div><b>{d.counts[k]}</b><span>{label}</span></div>
          </div>
        ))}
      </div>

      <div className="cols2">
        <div className="card">
          <div className="card-head"><h2>Teachers today</h2><Link to="/admin/attendance">View all</Link></div>
          <div className="stack" aria-hidden="true">
            <i style={{ width: `${(t.present / tTotal) * 100}%`, background: 'var(--ok)' }} />
            <i style={{ width: `${(t.late / tTotal) * 100}%`, background: 'var(--warn)' }} />
            <i style={{ width: `${(t.absent / tTotal) * 100}%`, background: 'var(--bad)' }} />
            <i style={{ width: `${(t.leave / tTotal) * 100}%`, background: '#6b7bd6' }} />
          </div>
          <ul className="legend">
            <li><i style={{ background: 'var(--ok)' }} />Present <b>{t.present}</b></li>
            <li><i style={{ background: 'var(--warn)' }} />Late <b>{t.late}</b></li>
            <li><i style={{ background: 'var(--bad)' }} />Not checked in <b>{t.absent}</b></li>
            <li><i style={{ background: '#6b7bd6' }} />On leave <b>{t.leave}</b></li>
          </ul>
        </div>

        <div className="card">
          <div className="card-head"><h2>Student registers today</h2><Link to="/admin/student-attendance">View all</Link></div>
          <p className="big-num">{s.registers}<small> of {s.classes} classes marked</small></p>
          <div className="stack" aria-hidden="true">
            <i style={{ width: `${sTotal ? (s.present / sTotal) * 100 : 0}%`, background: 'var(--ok)' }} />
            <i style={{ width: `${sTotal ? (s.late / sTotal) * 100 : 0}%`, background: 'var(--warn)' }} />
            <i style={{ width: `${sTotal ? (s.absent / sTotal) * 100 : 0}%`, background: 'var(--bad)' }} />
          </div>
          <ul className="legend">
            <li><i style={{ background: 'var(--ok)' }} />Present <b>{s.present}</b></li>
            <li><i style={{ background: 'var(--warn)' }} />Late <b>{s.late}</b></li>
            <li><i style={{ background: 'var(--bad)' }} />Absent <b>{s.absent}</b></li>
          </ul>
        </div>

        <div className="card">
          <div className="card-head"><h2>Upcoming exams</h2><Link to="/admin/exams">Manage</Link></div>
          {d.upcomingExams.length ? (
            <ul className="list">
              {d.upcomingExams.map((e) => (
                <li key={e.id}>
                  <div><b>{e.name}: {e.subject}</b><small>{e.class} · {e.date}</small></div>
                  <span className={`badge ${e.hasPaper ? 'present' : 'late'}`}>{e.hasPaper ? 'Paper ready' : 'No paper'}</span>
                </li>
              ))}
            </ul>
          ) : <p className="empty">No upcoming exams.</p>}
        </div>

        <div className="card">
          <div className="card-head"><h2>Students per class</h2><Link to="/admin/classes">Classes</Link></div>
          {d.classSizes.length ? d.classSizes.map((c) => (
            <div key={c.id} className="bar-row"><span>{c.name}</span><div className="bar"><i style={{ width: `${(c.students / maxClass) * 100}%` }} /></div><b>{c.students}</b></div>
          )) : <p className="empty">No classes yet.</p>}
        </div>
      </div>
    </section>
  );
}
