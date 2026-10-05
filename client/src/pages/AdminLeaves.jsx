import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';
import { TYPES, range } from './TeacherLeaves.jsx';

const FILTERS = ['pending', 'approved', 'rejected', 'all'];

export default function AdminLeaves() {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/leaves', { params: status === 'all' ? {} : { status } }).then((r) => setRows(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { setError(''); load(); }, [status]);

  const decide = async (decision) => {
    setBusy(true); setError('');
    try { await api.put(`/leaves/${sel._id}/review`, { status: decision, note }); setSel(null); setNote(''); await load(); }
    catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <section>
      <div className="page-head"><div><h1>Leave requests</h1><p className="sub">Approved leave days show as "on leave" instead of "absent" in teacher attendance.</p></div></div>
      <div className="tabs">
        {FILTERS.map((x) => <button key={x} className={status === x ? '' : 'ghost'} onClick={() => setStatus(x)} style={{ textTransform: 'capitalize' }}>{x}</button>)}
      </div>
      {error && !sel && <p className="msg bad">{error}</p>}

      <div className="scroll">
        <table>
          <thead><tr><th>Teacher</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th className="r">Action</th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l._id}>
                <td><span className="who-cell"><Avatar name={l.teacher?.name} url={l.teacher?.photo?.url} size={32} />{l.teacher?.name}</span></td>
                <td>{TYPES[l.type]}</td><td>{range(l)}</td><td>{l.days}</td>
                <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                <td className="r"><button className={l.status === 'pending' ? '' : 'ghost'} onClick={() => { setSel(l); setNote(l.reviewNote || ''); setError(''); }}>{l.status === 'pending' ? 'Review' : 'View'}</button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="6" className="empty">No {status === 'all' ? '' : status} requests.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && (
        <Modal title="Leave request" onClose={() => setSel(null)}>
          <div className="form">
            <div className="who-cell"><Avatar name={sel.teacher?.name} url={sel.teacher?.photo?.url} size={44} /><div><b>{sel.teacher?.name}</b><br /><span className="sub">{TYPES[sel.type]} · {range(sel)} · {sel.days} day(s)</span></div></div>
            <div><b>Reason</b><p style={{ margin: '.25rem 0 0' }}>{sel.reason}</p></div>
            <label className="field"><span>Note to teacher (optional)</span><textarea maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></label>
            {error && <p className="msg bad">{error}</p>}
            <div className="modal-foot">
              <button className="danger" disabled={busy || sel.status === 'rejected'} onClick={() => decide('rejected')}>Reject</button>
              <button disabled={busy || sel.status === 'approved'} onClick={() => decide('approved')}>Approve</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
