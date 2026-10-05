import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';

export const TYPES = { casual: 'Casual leave', sick: 'Sick leave', other: 'Other' };
export const range = (l) => (l.fromDate === l.toDate ? l.fromDate : `${l.fromDate} to ${l.toDate}`);

export default function TeacherLeaves() {
  const today = new Date().toLocaleDateString('en-CA');
  const blank = { type: 'casual', fromDate: today, toDate: today, reason: '' };
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([api.get('/leaves/mine'), api.get('/holidays')]).then(([l, h]) => { setLeaves(l.data); setHolidays(h.data); });
  useEffect(() => { load().catch((e) => setListError(errMsg(e))); }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.post('/leaves', f); setOpen(false); setF(blank); await load(); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };
  const cancel = async (l) => {
    if (!confirm('Cancel this leave request?')) return;
    try { await api.delete(`/leaves/${l._id}`); await load(); } catch (err) { setListError(errMsg(err)); }
  };
  const upcoming = holidays.filter((h) => h.endDate >= today).slice(0, 6);

  return (
    <section>
      <div className="page-head">
        <div><h1>My leaves</h1><p className="sub">Apply for leave and track approval.</p></div>
        <button onClick={() => { setF(blank); setError(''); setOpen(true); }}><Icon name="plus" /> Apply for leave</button>
      </div>
      {listError && <p className="msg bad">{listError}</p>}

      <div className="scroll">
        <table>
          <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l._id}>
                <td>{TYPES[l.type]}</td><td>{range(l)}</td><td>{l.days}</td><td>{l.reason}{l.reviewNote && <><br /><small className="sub">Admin: {l.reviewNote}</small></>}</td>
                <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                <td className="r">{l.status === 'pending' && <button className="danger sm" onClick={() => cancel(l)}>Cancel</button>}</td>
              </tr>
            ))}
            {!leaves.length && <tr><td colSpan="6" className="empty">You have not applied for any leave yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Upcoming holidays</h2>
        {upcoming.length ? (
          <ul className="list">{upcoming.map((h) => <li key={h._id}><b>{h.name}</b><span className="sub">{range({ fromDate: h.startDate, toDate: h.endDate })}</span></li>)}</ul>
        ) : <p className="empty">No upcoming holidays listed.</p>}
      </div>

      {open && (
        <Modal title="Apply for leave" onClose={() => setOpen(false)}>
          <form className="form cols" onSubmit={submit}>
            <label className="field full"><span>Leave type</span>
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="field"><span>From</span><input type="date" required min={today} value={f.fromDate} onChange={(e) => setF({ ...f, fromDate: e.target.value, toDate: e.target.value > f.toDate ? e.target.value : f.toDate })} /></label>
            <label className="field"><span>To</span><input type="date" required min={f.fromDate} value={f.toDate} onChange={(e) => setF({ ...f, toDate: e.target.value })} /></label>
            <label className="field full"><span>Reason</span><textarea required maxLength={500} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></label>
            {error && <p className="msg bad full">{error}</p>}
            <div className="modal-foot">
              <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button disabled={busy}>{busy ? 'Sending…' : 'Submit request'}</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
