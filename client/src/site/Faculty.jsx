import { useEffect, useState } from 'react';
import api from '../api';
import { FacultyCard, PageHero, useReveal } from './ui.jsx';

export default function Faculty() {
  const [list, setList] = useState(null);
  const [subject, setSubject] = useState('');
  useEffect(() => { api.get('/public/faculty').then((r) => setList(r.data)).catch(() => setList([])); }, []);
  const subjects = [...new Set((list || []).flatMap((t) => t.subjects))].sort();
  const shown = (list || []).filter((t) => !subject || t.subjects.includes(subject));
  useReveal(`${shown.length}-${subject}`);

  return (
    <>
      <PageHero title="Our Faculty" text="The teachers who inspire our students every day" />
      <section className="s-section">
        <div className="s-wrap">
          {subjects.length > 1 && (
            <div className="s-filters" role="group" aria-label="Filter by subject">
              <button className={!subject ? 'on' : ''} onClick={() => setSubject('')}>All</button>
              {subjects.map((s) => <button key={s} className={subject === s ? 'on' : ''} onClick={() => setSubject(s)}>{s}</button>)}
            </div>
          )}
          {list === null ? <span className="s-spinner" role="status" aria-label="Loading" /> : shown.length ? (
            <div className="s-grid4">{shown.map((t) => <FacultyCard key={t.id} t={t} full />)}</div>
          ) : <p className="s-muted center">Faculty profiles will appear here soon.</p>}
        </div>
      </section>
    </>
  );
}
