import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { initialsOf } from '../components/Avatar.jsx';
import { useSchool } from '../context/SchoolContext.jsx';

export default function StudentProfile() {
  const { id } = useParams();
  const { school } = useSchool();
  const [s, setS] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/students/${id}`).then((r) => setS(r.data)).catch((e) => setError(errMsg(e)));
    api.get(`/results/student/${id}`).then((r) => setReport(r.data)).catch(() => {});
  }, [id]);

  if (error) return <section><Link to="/admin/students">← Students</Link><p className="msg bad" style={{ marginTop: '1rem' }}>{error}</p></section>;
  if (!s) return <p className="sub">Loading…</p>;

  const cls = s.class ? `${s.class.name} ${s.class.section}` : '–';
  const code = `${initialsOf(school.schoolName)}-${new Date(s.createdAt).getFullYear()}-${String(s._id).slice(-4).toUpperCase()}`;
  const issued = new Date(s.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' });

  return (
    <section>
      <div className="page-head no-print">
        <div><Link to="/admin/students">← Students</Link><h1 style={{ marginTop: '.3rem' }}>{s.name}</h1></div>
        <div className="row"><Link className="btn ghost" to={`/admin/results?student=${s._id}`}>View report card</Link><button onClick={() => window.print()}>Print ID card</button></div>
      </div>

      <div className="profile-grid">
        <div className="idcard">
          <div className="idcard-top">
            {school.logo ? <img className="idcard-logo" src={school.logo} alt="" /> : <span className="idcard-logo mark">{initialsOf(school.schoolName)}</span>}
            <div><b>{school.schoolName}</b><small>Student identity card</small></div>
          </div>
          <div className="idcard-body">
            <div className="idcard-photo">{s.photo?.url ? <img src={s.photo.url} alt={`${s.name}`} /> : <span className="idcard-initials">{initialsOf(s.name)}</span>}</div>
            <dl className="idcard-info">
              <div className="idcard-name">{s.name}</div>
              <div className="r2"><dt>Class</dt><dd>{cls}</dd></div>
              <div className="r2"><dt>Roll no.</dt><dd>{s.rollNo}</dd></div>
              <div className="r2"><dt>Guardian</dt><dd>{s.guardianName || '–'}</dd></div>
              <div className="r2"><dt>Phone</dt><dd>{s.guardianPhone || '–'}</dd></div>
            </dl>
          </div>
          <div className="idcard-foot"><span>ID {code}</span><span>Issued {issued}</span></div>
        </div>

        <div className="no-print">
          <div className="card">
            <h2>Student details</h2>
            <dl className="details">
              <div><dt>Full name</dt><dd>{s.name}</dd></div>
              <div><dt>Class</dt><dd>{cls}</dd></div>
              <div><dt>Roll number</dt><dd>{s.rollNo}</dd></div>
              <div><dt>Guardian</dt><dd>{s.guardianName || '–'}</dd></div>
              <div><dt>Guardian phone</dt><dd>{s.guardianPhone || '–'}</dd></div>
              <div><dt>ID number</dt><dd>{code}</dd></div>
            </dl>
          </div>
          {report && (
            <div className="stats">
              <div className="stat"><b>{report.summary.percent == null ? '–' : `${report.summary.percent}%`}</b><span>Overall marks</span></div>
              <div className="stat"><b>{report.summary.grade || '–'}</b><span>Grade</span></div>
              <div className="stat"><b>{report.attendance.percent == null ? '–' : `${report.attendance.percent}%`}</b><span>Attendance</span></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
