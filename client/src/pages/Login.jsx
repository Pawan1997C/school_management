import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const u = await login(f.email, f.password); nav(u.role === 'admin' ? '/admin/dashboard' : '/teacher'); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <aside className="auth-art">
        <span className="logo">SM</span>
        <h2>School Manager</h2>
        <p>Classes, timetables, attendance, exams and report cards, all in one place.</p>
      </aside>
      <main className="auth-main">
        <form className="auth-card form" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p className="sub">Log in to your admin or teacher account.</p>
          <label className="field"><span>Email</span>
            <input type="email" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="field"><span>Password</span>
            <input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          {error && <p className="msg bad">{error}</p>}
          <button disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <Link to="/">← Back to website</Link>
        </form>
      </main>
    </div>
  );
}
