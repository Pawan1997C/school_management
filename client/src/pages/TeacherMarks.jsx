import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import Avatar from '../components/Avatar.jsx';

const toStr = (v) => (v == null ? '' : String(v));

export default function TeacherMarks() {
  const [sp, setSp] = useSearchParams();
  const today = new Date().toLocaleDateString('en-CA');
  const examId = sp.get('exam') || '';
  const [exams, setExams] = useState([]);
  const [rows, setRows] = useState([]);
  const [orig, setOrig] = useState({});
  const [q, setQ] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const refs = useRef([]);
  const exam = exams.find((e) => e._id === examId);
  const upcoming = !!exam && exam.date > today;

  useEffect(() => {
    api.get('/exams').then(({ data }) => {
      setExams(data);
      if (!data.some((e) => e._id === examId) && data.length) {
        const first = data.find((e) => e.date <= today) || data[0];
        setSp({ exam: first._id }, { replace: true });
      }
    }).catch((e) => setMsg({ bad: true, text: errMsg(e) }));
  }, []);

  useEffect(() => {
    if (!examId) return;
    setRows([]); setMsg(null);
    api.get(`/exams/${examId}/marks`).then(({ data }) => {
      const list = data.rows.map((r) => ({ ...r, marks: toStr(r.marks) }));
      setRows(list);
      setOrig(Object.fromEntries(list.map((r) => [r.studentId, { marks: r.marks, absent: r.absent }])));
    }).catch((e) => setMsg({ bad: true, text: errMsg(e) }));
  }, [examId]);

  const upd = (id, patch) => setRows((rs) => rs.map((r) => (r.studentId === id ? { ...r, ...patch } : r)));
  const dirty = (r) => orig[r.studentId] && (orig[r.studentId].marks !== r.marks || orig[r.studentId].absent !== r.absent);
  const invalid = (r) => !r.absent && r.marks !== '' && (!Number.isFinite(Number(r.marks)) || Number(r.marks) < 0 || Number(r.marks) > exam.maxMarks);
  const savedEntered = (r) => orig[r.studentId] && (orig[r.studentId].absent || orig[r.studentId].marks !== '');

  const changed = rows.filter(dirty);
  const hasInvalid = changed.some(invalid);
  const done = rows.filter(savedEntered).length;
  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => (!term || r.name.toLowerCase().includes(term) || String(r.rollNo).toLowerCase().includes(term)) && (!pendingOnly || !savedEntered(r)));

  const focusNext = (i) => {
    for (let j = i + 1; j < refs.current.length; j += 1) {
      const el = refs.current[j];
      if (el && !el.disabled) { el.focus(); el.select(); return; }
    }
  };

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await api.put(`/exams/${examId}/marks`, { scores: changed.map((r) => ({ student: r.studentId, marks: r.marks, absent: r.absent })) });
      setOrig((o) => ({ ...o, ...Object.fromEntries(changed.map((r) => [r.studentId, { marks: r.absent ? '' : r.marks, absent: r.absent }])) }));
      setRows((rs) => rs.map((r) => (r.absent && r.marks !== '' ? { ...r, marks: '' } : r)));
      setMsg({ text: `Saved marks for ${changed.length} student${changed.length === 1 ? '' : 's'}.` });
    } catch (e) { setMsg({ bad: true, text: errMsg(e) }); }
    finally { setBusy(false); }
  };

  if (!exams.length && !msg) return <section><h1>Enter marks</h1><p className="empty">No exams for your classes yet. The admin schedules them.</p></section>;

  return (
    <section>
      <div className="page-head"><div><h1>Enter marks</h1><p className="sub">Student-wise scores. Press Enter to move to the next student.</p></div></div>

      <div className="card">
        <label className="field" style={{ maxWidth: 560 }}><span>Exam</span>
          <select value={examId} onChange={(e) => setSp({ exam: e.target.value })}>
            {exams.map((e) => <option key={e._id} value={e._id}>{e.name}: {e.subject.name}, {e.class.name} {e.class.section} ({e.date}){e.date > today ? ' - opens on exam date' : ''}</option>)}
          </select></label>
        {exam && (
          <p className="sub" style={{ marginTop: '.75rem' }}>
            {exam.subject.name} · {exam.class.name} {exam.class.section} · {exam.date} · out of {exam.maxMarks} · <b>{done} of {rows.length}</b> students have marks saved
            {exam.paper?.url && <> · <a href={exam.paper.url} target="_blank" rel="noreferrer">View paper</a></>}
          </p>
        )}
        {upcoming && <p className="msg ok" style={{ marginTop: '.75rem' }}>Marks can be entered from the exam date ({exam.date}).</p>}
      </div>

      {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'}`} style={{ marginBottom: '1rem' }}>{msg.text}</p>}

      {exam && (
        <>
          <div className="toolbar">
            <input className="search-input" placeholder="Search student or roll number…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
            <label className="chip"><input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />Pending only</label>
          </div>
          <div className="scroll">
            <table>
              <thead><tr><th>Roll</th><th>Student</th><th>Marks</th><th>%</th><th>Absent</th><th>Status</th></tr></thead>
              <tbody>
                {shown.map((r, i) => {
                  const bad = invalid(r);
                  const pct = !r.absent && r.marks !== '' && !bad ? `${Math.round((Number(r.marks) / exam.maxMarks) * 1000) / 10}%` : '–';
                  return (
                    <tr key={r.studentId} className={dirty(r) ? 'dirty' : ''}>
                      <td>{r.rollNo}</td>
                      <td><span className="who-cell"><Avatar name={r.name} url={r.photo} size={32} />{r.name}</span></td>
                      <td>
                        <div className="marks-in">
                          <input ref={(el) => { refs.current[i] = el; }} type="number" inputMode="decimal" min="0" max={exam.maxMarks} step="any"
                            className={bad ? 'invalid' : ''} disabled={r.absent || upcoming} value={r.absent ? '' : r.marks}
                            onChange={(e) => upd(r.studentId, { marks: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusNext(i); } }}
                            aria-label={`Marks for ${r.name}`} aria-invalid={bad} />
                          <span className="sub">/ {exam.maxMarks}</span>
                        </div>
                        {bad && <small className="field-err">Enter 0 to {exam.maxMarks}</small>}
                      </td>
                      <td>{pct}</td>
                      <td><input type="checkbox" disabled={upcoming} checked={r.absent} onChange={(e) => upd(r.studentId, { absent: e.target.checked })} aria-label={`${r.name} was absent`} /></td>
                      <td>{dirty(r) ? <span className="badge late">Unsaved</span> : savedEntered(r) ? <span className="badge present">{orig[r.studentId].absent ? 'Absent' : 'Saved'}</span> : <span className="badge pending">Pending</span>}</td>
                    </tr>
                  );
                })}
                {!shown.length && <tr><td colSpan="6" className="empty">{rows.length ? 'No students match.' : 'No students in this class yet.'}</td></tr>}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="savebar">
              <span className="sub">{changed.length ? `${changed.length} unsaved change${changed.length === 1 ? '' : 's'}` : 'All changes saved'}</span>
              <button onClick={save} disabled={busy || !changed.length || hasInvalid || upcoming}>{busy ? 'Saving…' : 'Save marks'}</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
