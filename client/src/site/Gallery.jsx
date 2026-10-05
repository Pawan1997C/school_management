import { useEffect, useState } from 'react';
import api from '../api';
import { PageHero, useReveal } from './ui.jsx';

function Lightbox({ items, index, onClose, onIndex }) {
  const n = items.length;
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % n);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + n) % n);
    };
    window.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = ''; };
  }, [index, n]);
  const it = items[index];
  return (
    <div className="s-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <button className="s-lb-btn close" onClick={onClose} aria-label="Close">×</button>
      {n > 1 && <button className="s-lb-btn prev" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + n) % n); }} aria-label="Previous photo">‹</button>}
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={it.image} alt={it.caption || 'School photo'} />
        {(it.caption || it.category) && <figcaption>{it.caption}{it.caption && it.category ? ' · ' : ''}<span>{it.category}</span></figcaption>}
      </figure>
      {n > 1 && <button className="s-lb-btn next" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % n); }} aria-label="Next photo">›</button>}
    </div>
  );
}

export default function Gallery() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState('');
  const [open, setOpen] = useState(null);
  useEffect(() => { api.get('/public/gallery').then((r) => setItems(r.data)).catch(() => setItems([])); }, []);
  const cats = [...new Set((items || []).map((g) => g.category))].sort();
  const shown = (items || []).filter((g) => !cat || g.category === cat);
  useReveal(`${shown.length}-${cat}`);

  return (
    <>
      <PageHero title="Gallery" text="Moments from classrooms, campus and celebrations" />
      <section className="s-section">
        <div className="s-wrap">
          {cats.length > 1 && (
            <div className="s-filters" role="group" aria-label="Filter by album">
              <button className={!cat ? 'on' : ''} onClick={() => setCat('')}>All</button>
              {cats.map((x) => <button key={x} className={cat === x ? 'on' : ''} onClick={() => setCat(x)}>{x}</button>)}
            </div>
          )}
          {items === null ? <span className="s-spinner" role="status" aria-label="Loading" /> : shown.length ? (
            <div className="s-masonry">
              {shown.map((g, i) => (
                <button key={g.id} className="s-shot s-reveal" onClick={() => setOpen(i)} aria-label={`Open photo: ${g.caption || g.category}`}>
                  <img src={g.image} alt={g.caption || 'School photo'} loading="lazy" />
                  {g.caption && <span>{g.caption}</span>}
                </button>
              ))}
            </div>
          ) : <p className="s-muted center">Photos will appear here soon.</p>}
        </div>
      </section>
      {open !== null && shown[open] && <Lightbox items={shown} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </>
  );
}
