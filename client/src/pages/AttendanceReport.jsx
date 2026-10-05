import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export default function AttendanceReport() {
  const [date, setDate] = useState('');
  const [data, setData] = useState({ rows: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/attendance', { params: date ? { date } : {} })
      .then((r) => { setData(r.data); if (!date) setDate(r.data.date); })
      .catch((e) => setError(errMsg(e)));
  }, [date]);

  const count = (s) => data.rows.filter((r) => r.status === s).length;
  return (
    <section>
      <h1>Teacher attendance</h1>
      <label className="field narrow"><span>Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <p className="summary">{count('present')} present, {count('late')} late, {count('leave')} on leave, {count('absent')} absent</p>
      {data.holiday && <p className="msg ok">Holiday: {data.holiday}. Attendance is not expected on this day.</p>}
      {error && <p className="msg bad">{error}</p>}
      <div className="scroll">
        <table>
          <thead><tr><th>Teacher</th><th>Status</th><th>Checked in</th><th>Checked out</th><th>Distance from school</th></tr></thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.teacherId}>
                <td>{r.name}</td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                <td>{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–'}</td>
                <td>{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–'}</td>
                <td>{r.distance != null ? `${r.distance} m` : '–'}</td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan="5" className="empty">No teachers yet. Add teachers to track their attendance.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
