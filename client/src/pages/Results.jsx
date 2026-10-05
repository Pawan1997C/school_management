import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

const statusClass = { pass: 'present', fail: 'absent', absent: 'late', pending: 'pending' };
const Status = ({ s }) => <span className={`badge ${statusClass[s]}`}>{s}</span>;
const fmt = (v, suffix = '') => (v == null ? '–' : `${v}${suffix}`);
const Stat = ({ label, value }) => <div className="stat"><b>{value}</b><span>{label}</span></div>;

function useClasses(role) {
  const [classes, setClasses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const req = role === 'admin'
      ? api.get('/classes').then((r) => r.data)
      : api.get('/assignments/mine').then((r) => [...new Map(r.data.map((a) => [a.class._id, a.class])).values()]);
    req.then(setClasses).finally(() => setLoaded(true));
  }, [role]);
  return { classes, loaded };
}

function ExamResults() {
  const [exams, setExams] = useState([]);
  const [id, setId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/exams').then((r) => { setExams(r.data); if (r.data[0]) setId(r.data[0]._id); }).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => {
    if (!id) return;
    setData(null); setError('');
    api.get(`/results/exam/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (!exams.length && !error) return <p className="empty">No exams yet.</p>;
  const s = data?.stats;
  return (
    <div>
      <label className="field narrow" style={{ maxWidth: 480 }}><span>Exam</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {exams.map((e) => <option key={e._id} value={e._id}>{e.name}: {e.subject.name}, {e.class.name} {e.class.section} ({e.date})</option>)}
        </select></label>
      {error && <p className="msg bad">{error}</p>}
      {data && (
        <>
          <div className="stats">
            <Stat label="Average" value={fmt(s.average, `/${data.exam.maxMarks}`)} />
            <Stat label="Highest" value={fmt(s.highest)} />
            <Stat label="Lowest" value={fmt(s.lowest)} />
            <Stat label={`Pass rate (${data.passPercent}%)`} value={fmt(s.passRate, '%')} />
            <Stat label="Absent" value={s.absent} />
            <Stat label="Scores pending" value={s.pending} />
          </div>
          <div className="scroll">
            <table>
              <thead><tr><th>Rank</th><th>Roll</th><th>Student</th><th>Marks (/{data.exam.maxMarks})</th><th>%</th><th>Grade</th><th>Result</th></tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.studentId}>
                    <td>{fmt(r.rank)}</td><td>{r.rollNo}</td><td>{r.name}</td><td>{fmt(r.marks)}</td><td>{fmt(r.percent)}</td><td>{fmt(r.grade)}</td><td><Status s={r.status} /></td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td colSpan="7" className="empty">No students in this class.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ClassReports({ role, onOpen }) {
  const { classes, loaded } = useClasses(role);
  const [classId, setClassId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { if (classes[0] && !classId) setClassId(classes[0]._id); }, [classes]);
  useEffect(() => {
    if (!classId) return;
    setData(null); setError('');
    api.get(`/results/class/${classId}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [classId]);

  if (loaded && !classes.length) return <p className="empty">{role === 'admin' ? 'Add classes first.' : 'You have no classes yet.'}</p>;
  return (
    <div>
      <label className="field narrow"><span>Class</span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
        </select></label>
      {error && <p className="msg bad">{error}</p>}
      {data && (
        <>
          <p className="summary">{data.examCount} exam(s) scheduled. Overall % counts only exams with a score entered.</p>
          <div className="scroll">
            <table>
              <thead><tr><th>Rank</th><th>Roll</th><th>Student</th><th>Exams</th><th>Total</th><th>%</th><th>Grade</th><th>Attendance</th><th /></tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.studentId}>
                    <td>{fmt(r.rank)}</td><td>{r.rollNo}</td><td>{r.name}</td><td>{r.examsTaken}</td>
                    <td>{r.total != null ? `${r.total}/${r.maxTotal}` : '–'}</td><td>{fmt(r.percent)}</td><td>{fmt(r.grade)}</td><td>{fmt(r.attendancePercent, '%')}</td>
                    <td><button className="ghost" onClick={() => onOpen(r.studentId)}>Report card</button></td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td colSpan="9" className="empty">No students in this class yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({ id, onBack }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/results/student/${id}`).then((r) => setD(r.data)).catch((e) => setError(errMsg(e))); }, [id]);

  return (
    <section className="report">
      <div className="row no-print" style={{ marginBottom: '1rem' }}>
        <button className="ghost" onClick={onBack}>Back</button>
        {d && <button onClick={() => window.print()}>Print report</button>}
      </div>
      {error && <p className="msg bad">{error}</p>}
      {d && (
        <>
          <div className="card">
            <div className="row" style={{ alignItems: 'center' }}>
              <Avatar name={d.student.name} url={d.student.photo} size={64} />
              <div>
                <h1 style={{ margin: 0 }}>{d.student.name}</h1>
                <p className="summary" style={{ margin: 0 }}>Roll {d.student.rollNo} · {d.class.name} {d.class.section}{d.student.guardianName ? ` · Guardian: ${d.student.guardianName}` : ''}</p>
              </div>
            </div>
            <div className="stats">
              <Stat label="Overall" value={fmt(d.summary.percent, '%')} />
              <Stat label="Grade" value={fmt(d.summary.grade)} />
              <Stat label="Total marks" value={d.summary.examsScored ? `${d.summary.total}/${d.summary.maxTotal}` : '–'} />
              <Stat label="Attendance" value={fmt(d.attendance.percent, '%')} />
            </div>
          </div>

          <h2>Exam results</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Marks</th><th>%</th><th>Grade</th><th>Result</th></tr></thead>
              <tbody>
                {d.rows.map((r) => (
                  <tr key={r.examId}><td>{r.exam}</td><td>{r.subject}</td><td>{r.date}</td><td>{r.marks != null ? `${r.marks}/${r.maxMarks}` : '–'}</td><td>{fmt(r.percent)}</td><td>{fmt(r.grade)}</td><td><Status s={r.status} /></td></tr>
                ))}
                {!d.rows.length && <tr><td colSpan="7" className="empty">No exams for this class yet.</td></tr>}
              </tbody>
            </table>
          </div>

          {d.subjects.length > 0 && (
            <>
              <h2 style={{ marginTop: '1.25rem' }}>Subject-wise</h2>
              <div className="scroll">
                <table>
                  <thead><tr><th>Subject</th><th>Total</th><th>%</th><th>Grade</th></tr></thead>
                  <tbody>{d.subjects.map((s) => <tr key={s.subject}><td>{s.subject}</td><td>{s.total}/{s.maxTotal}</td><td>{s.percent}</td><td>{s.grade}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}

          <h2 style={{ marginTop: '1.25rem' }}>Attendance</h2>
          <p>{d.attendance.days ? `${d.attendance.present} present, ${d.attendance.late} late, ${d.attendance.absent} absent over ${d.attendance.days} days.` : 'No attendance has been recorded yet.'}</p>
          <p className="summary">Pass mark: {d.passPercent}%. Late counts as attended.</p>
        </>
      )}
    </section>
  );
}

export default function Results() {
  const { user } = useAuth();
  const [tab, setTab] = useState('exam');
  const [student, setStudent] = useState(new URLSearchParams(window.location.search).get('student'));

  if (student) return <ReportCard id={student} onBack={() => setStudent(null)} />;
  return (
    <section>
      <h1>Results and reports</h1>
      <div className="tabs">
        <button className={tab === 'exam' ? '' : 'ghost'} onClick={() => setTab('exam')}>Exam results</button>
        <button className={tab === 'class' ? '' : 'ghost'} onClick={() => setTab('class')}>Student reports</button>
      </div>
      {tab === 'exam' ? <ExamResults /> : <ClassReports role={user.role} onOpen={setStudent} />}
    </section>
  );
}
