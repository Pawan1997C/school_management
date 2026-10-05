import { useEffect, useState } from 'react';
import api from '../api';
import { PageHero, PostCard, useReveal } from './ui.jsx';

export default function News() {
  const [posts, setPosts] = useState(null);
  const [type, setType] = useState('');
  useEffect(() => { api.get('/public/posts').then((r) => setPosts(r.data)).catch(() => setPosts([])); }, []);
  const shown = (posts || []).filter((p) => !type || p.type === type);
  useReveal(`${shown.length}-${type}`);

  return (
    <>
      <PageHero title="News & Events" text="Announcements, achievements and upcoming events" />
      <section className="s-section">
        <div className="s-wrap">
          <div className="s-filters" role="group" aria-label="Filter">
            {[['', 'All'], ['news', 'News'], ['event', 'Events']].map(([v, label]) => <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{label}</button>)}
          </div>
          {posts === null ? <span className="s-spinner" role="status" aria-label="Loading" /> : shown.length ? (
            <div className="s-grid3">{shown.map((p) => <PostCard key={p.id} p={p} full />)}</div>
          ) : <p className="s-muted center">Nothing posted yet. Please check back soon.</p>}
        </div>
      </section>
    </>
  );
}
