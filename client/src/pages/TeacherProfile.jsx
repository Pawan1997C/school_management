import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

const EMPTY_PW = { currentPassword: '', newPassword: '', confirm: '' };

export default function TeacherProfile() {
  const { reload } = useAuth();
  const [p, setP] = useState(null);
  const [f, setF] = useState({ name: '', phone: '' });
  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState(EMPTY_PW);
  const [pwMsg, setPwMsg] = useState(null);

  const load = () => api.get('/profile').then(({ data }) => { setP(data); setF({ name: data.name, phone: data.phone || '' }); });
  useEffect(() => { load().catch((e) => setMsg({ bad: true, text: errMsg(e) })); }, []);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('name', f.name); fd.append('phone', f.phone);
      if (photo) fd.append('photo', photo);
      if (removePhoto) fd.append('removePhoto', 'true');
      await api.put('/profile', fd);
      setPhoto(null); setRemovePhoto(false); setFileKey((k) => k + 1);
      await load(); await reload();
      setMsg({ text: 'Profile updated' });
    } catch (err) { setMsg({ bad: true, text: errMsg(err) }); }
    finally { setBusy(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault(); setPwMsg(null);
    if (pw.newPassword !== pw.confirm) return setPwMsg({ bad: true, text: 'The new passwords do not match' });
    try {
      await api.put('/profile/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw(EMPTY_PW); setPwMsg({ text: 'Password changed' });
    } catch (err) { setPwMsg({ bad: true, text: errMsg(err) }); }
  };

  if (!p) return msg ? <p className="msg bad">{msg.text}</p> : <p className="sub">Loading…</p>;
  return (
    <section className="settings-wrap">
      <div className="page-head"><div><h1>My profile</h1><p className="sub">Update your details. Email, employee ID and subjects are managed by the admin.</p></div></div>

      <form className="card" onSubmit={save}>
        <div className="logo-edit" style={{ marginBottom: '1rem' }}>
          <Avatar name={f.name} url={removePhoto ? null : p.photo?.url} size={84} />
          <div>
            <input key={fileKey} type="file" accept="image/*" onChange={(e) => { setPhoto(e.target.files[0]); setRemovePhoto(false); }} />
            {p.photo?.url && !photo && (
              <label className="chip" style={{ marginTop: '.5rem' }}><input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} />Remove my photo</label>
            )}
          </div>
        </div>
        <div className="form cols">
          <label className="field"><span>Full name</span><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="field"><span>Phone</span><input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <label className="field"><span>Login email</span><input value={p.email} disabled /></label>
          <label className="field"><span>Employee ID</span><input value={p.employeeId || '–'} disabled /></label>
          <label className="field full"><span>Subjects you teach</span><input value={p.subjects.map((s) => s.name).join(', ') || '–'} disabled /></label>
          {msg && <p className={`msg ${msg.bad ? 'bad' : 'ok'} full`}>{msg.text}</p>}
          <div className="full"><button disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
        </div>
      </form>

      <form className="card" onSubmit={changePassword}>
        <h2>Change password</h2>
        <div className="form cols">
          <label className="field full"><span>Current password</span><input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
          <label className="field"><span>New password</span><input type="password" minLength={6} required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
          <label className="field"><span>Confirm new password</span><input type="password" minLength={6} required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
          {pwMsg && <p className={`msg ${pwMsg.bad ? 'bad' : 'ok'} full`}>{pwMsg.text}</p>}
          <div className="full"><button>Change password</button></div>
        </div>
      </form>
    </section>
  );
}
