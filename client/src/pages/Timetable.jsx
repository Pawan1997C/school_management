import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useSchool } from '../context/SchoolContext.jsx';
import { fmt12 } from '../utils/time.js';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Timetable() {
  const { school } = useSchool();
  const off = school.weeklyOff || [];
  const isOff = (d) => off.includes(d);
  const DAYS = ALL_DAYS.filter((d) => d !== 'Sun' || !isOff('Sun')); // Sunday only shows when it is a working day
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ subject: '', teacher: '' });
  const [pick, setPick] = useState([]); // days the new assignment applies to
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/subjects'), api.get('/teachers')]).then(([c, s, t]) => {
      setClasses(c.data); setSubjects(s.data); setTeachers(t.data);
      if (c.data[0]) setClassId(c.data[0]._id);
    }).catch((e) => setMsg({ bad: true, text: errMsg(e) }));
  }, []);

  const load = useCallback(
    () => (classId ? api.get('/assignments', { params: { classId } }).then((r) => setItems(r.data)) : Promise.resolve()),
    [classId]
  );
  useEffect(() => { load(); setSel(null); setMsg(null); }, [load]);

  const at = (day, period) => items.find((i) => i.day === day && i.period === period);
  const freeDays = (period) => DAYS.filter((d) => !isOff(d) && !at(d, period));
  const current = sel && at(sel.day, sel.period);
  const sameEverywhere = current
    ? items.filter((i) => i.period === current.period && i.teacher._id === current.teacher._id && i.subject._id === current.subject._id).length
    : 0;

  const choose = (day, period) => {
    setSel({ day, period });
    setMsg(null);
    if (!at(day, period)) setPick(freeDays(period)); // every working day this period is still free
  };
  const togglePick = (d) => setPick((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  const assign = async () => {
    setMsg(null);
    try {
      const { data } = await api.post('/assignments', { class: classId, subject: form.subject, teacher: form.teacher, period: sel.period, days: pick });
      const skipped = data.skipped.map((s) => `${s.day} (${s.reason})`).join(', ');
      setMsg({ bad: !data.created, text: `${data.created ? `Assigned on ${data.created} day(s).` : 'Nothing was assigned.'}${skipped ? ` Skipped: ${skipped}.` : ''}` });
      if (data.created) { setSel(null); setForm({ subject: '', teacher: '' }); }
      load();
    } catch (e) { setMsg({ bad: true, text: errMsg(e) }); }
  };
  const remove = async (id, all) => {
    await api.delete(`/assignments/${id}`, { params: all ? { allDays: 1 } : {} });
    setSel(null); setMsg(null); load();
  };

  if (!classes.length) return <section><h1>Timetable</h1><p className="empty">Add classes, subjects and teachers first, then assign periods here.</p></section>;

  return (
    <section>
      <div className="page-head"><div><h1>Timetable</h1><p className="sub">Pick a slot to assign a teacher. One selection can fill the same period on several days. Striped columns are weekly offs (change them in Settings).</p></div></div>
      <label className="field narrow"><span>Class</span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.section}</option>)}
        </select>
      </label>
      {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'}`} style={{ marginBottom: '1rem' }}>{msg.text}</p>}

      <div className="scroll">
        <table className="grid">
          <thead><tr><th>Period</th>{DAYS.map((d) => <th key={d} className={isOff(d) ? 'off-col' : ''}>{d}{isOff(d) && <small>Off</small>}</th>)}</tr></thead>
          <tbody>
            {school.periods.map((p) => (
              <tr key={p.number}>
                <th><b>P{p.number}</b><small>{fmt12(p.start)} – {fmt12(p.end)}</small></th>
                {DAYS.map((d) => {
                  const a = at(d, p.number);
                  const active = sel?.day === d && sel?.period === p.number;
                  if (isOff(d) && !a) return <td key={d}><button className="cell off" disabled aria-label={`${d} is a weekly off`}><small>Off</small></button></td>;
                  return (
                    <td key={d}>
                      <button className={`cell ${a ? 'filled' : ''} ${active ? 'active' : ''}`} onClick={() => choose(d, p.number)}>
                        {a ? <><b>{a.subject.code}</b><small>{a.teacher.name}</small></> : <small>Free</small>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="card form" style={{ marginTop: '1rem' }}>
          <h2>{sel.day}, period {sel.period}</h2>
          {current ? (
            <>
              <p>{current.subject.name} with {current.teacher.name}{isOff(sel.day) ? ' (this day is now a weekly off)' : ''}</p>
              <div className="row">
                <button className="danger" onClick={() => remove(current._id, false)}>Remove for {sel.day} only</button>
                {sameEverywhere > 1 && <button className="danger" onClick={() => remove(current._id, true)}>Remove from all {sameEverywhere} days</button>}
              </div>
            </>
          ) : (
            <>
              <label className="field"><span>Subject</span>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select…</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select></label>
              <label className="field"><span>Teacher</span>
                <select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}>
                  <option value="">Select…</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select></label>
              <div className="field">
                <span>Apply to days</span>
                <div className="days-pick">
                  {DAYS.map((d) => {
                    const weeklyOff = isOff(d), taken = !!at(d, sel.period);
                    return (
                      <label key={d} className="chip" title={weeklyOff ? 'Weekly off' : taken ? 'This class already has a teacher then' : ''}>
                        <input type="checkbox" disabled={weeklyOff || taken} checked={pick.includes(d)} onChange={() => togglePick(d)} />{d}
                      </label>
                    );
                  })}
                </div>
                <div className="row">
                  <button type="button" className="ghost sm" onClick={() => setPick(freeDays(sel.period))}>All free working days</button>
                  <button type="button" className="ghost sm" onClick={() => setPick([sel.day])}>Only {sel.day}</button>
                </div>
              </div>
              <div className="row"><button disabled={!form.subject || !form.teacher || !pick.length} onClick={assign}>Assign teacher</button></div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
