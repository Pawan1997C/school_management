import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export default function AdminEnquiries() {
  const [status, setStatus] = useState('new');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const load = () => api.get('/enquiries', { params: status === 'all' ? {} : { status } }).then((r) => setRows(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { setError(''); load(); }, [status]);

  const toggle = async (e) => { await api.put(`/enquiries/${e._id}`, { status: e.status === 'new' ? 'read' : 'new' }); load(); };
  const remove = async (e) => { if (confirm('Delete this enquiry?')) { await api.delete(`/enquiries/${e._id}`); load(); } };

  return (
    <section>
      <div className="page-head"><div><h1>Enquiries</h1><p className="sub">Messages sent from the contact form on your website.</p></div></div>
      <div className="tabs">
        {['new', 'all'].map((x) => <button key={x} className={status === x ? '' : 'ghost'} onClick={() => setStatus(x)} style={{ textTransform: 'capitalize' }}>{x === 'new' ? 'Unread' : 'All'}</button>)}
      </div>
      {error && <p className="msg bad">{error}</p>}
      {rows.map((e) => (
        <div key={e._id} className="card">
          <div className="card-head">
            <h2>{e.name} {e.status === 'new' && <span className="badge late">New</span>}</h2>
            <span className="sub">{new Date(e.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 .6rem' }}>{e.message}</p>
          <p className="sub" style={{ margin: '0 0 .8rem' }}>
            {e.phone && <><a href={`tel:${e.phone}`}>{e.phone}</a>{' '}</>}
            {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
          </p>
          <div className="row">
            <button className="ghost sm" onClick={() => toggle(e)}>{e.status === 'new' ? 'Mark as read' : 'Mark as unread'}</button>
            <button className="danger sm" onClick={() => remove(e)}>Delete</button>
          </div>
        </div>
      ))}
      {!rows.length && !error && <p className="empty">{status === 'new' ? 'No unread enquiries.' : 'No enquiries yet.'}</p>}
    </section>
  );
}
