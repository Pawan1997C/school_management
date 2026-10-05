import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

function ExamCard({ exam, reload, today }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const upcoming = exam.date > today;

  const upload = async () => {
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('paper', file);
      await api.post(`/exams/${exam._id}/paper`, fd);
      setFile(null); setMsg({ text: 'Paper uploaded' }); reload();
    } catch (e) { setMsg({ bad: true, text: errMsg(e) }); }
    finally { setBusy(false); }
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>{exam.name}: {exam.subject.name}, {exam.class.name} {exam.class.section}</h2>
        {upcoming ? <span className="summary">Marks open on {exam.date}</span> : <Link className="btn" to={`/teacher/marks?exam=${exam._id}`}>Enter student marks</Link>}
      </div>
      <p className="summary">{exam.date} · {exam.maxMarks} marks</p>
      <p>{exam.paper?.url ? <a href={exam.paper.url} target="_blank" rel="noreferrer">View paper ({exam.paper.fileName || 'file'})</a> : 'No test paper uploaded yet.'}</p>
      <div className="row">
        <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files[0])} style={{ maxWidth: 280 }} />
        <button onClick={upload} disabled={!file || busy}>{busy ? 'Uploading…' : exam.paper?.url ? 'Replace paper' : 'Upload paper'}</button>
      </div>
      {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'}`} style={{ marginTop: '.75rem' }}>{msg.text}</p>}
    </div>
  );
}

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const today = new Date().toLocaleDateString('en-CA');
  const load = () => api.get('/exams').then((r) => setExams(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-head"><div><h1>Exam papers</h1><p className="sub">Upload test papers here. Student marks are entered on the Enter marks page.</p></div></div>
      {error && <p className="msg bad">{error}</p>}
      {exams.map((x) => <ExamCard key={x._id} exam={x} reload={load} today={today} />)}
      {!exams.length && !error && <p className="empty">No exams for your classes yet. The admin schedules them.</p>}
    </section>
  );
}
