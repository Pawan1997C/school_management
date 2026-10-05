import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { initialsOf } from '../components/Avatar.jsx';

export const paras = (t = '') => t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
export const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
export const telHref = (p) => `tel:${p.replace(/[^\d+]/g, '')}`;

// Fade-in on scroll. Re-run when `dep` changes (data arrived after first render).
export function useReveal(dep) {
  useEffect(() => {
    const els = document.querySelectorAll('.s-reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return undefined; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
}

export function SmartLink({ to, children, ...rest }) {
  return to && to.startsWith('/')
    ? <Link to={to} {...rest}>{children}</Link>
    : <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
}

export const Head = ({ eyebrow, title, text, center }) => (
  <div className={`s-head s-reveal ${center ? 'center' : ''}`}>
    {eyebrow && <span className="s-eyebrow">{eyebrow}</span>}
    <h2>{title}</h2>
    {text && <p>{text}</p>}
  </div>
);

export const PageHero = ({ title, text }) => (
  <section className="s-pagehero">
    <div className="s-wrap"><h1>{title}</h1>{text && <p>{text}</p>}</div>
  </section>
);

export function Social({ social }) {
  const items = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['x', 'X']].filter(([k]) => social?.[k]);
  if (!items.length) return null;
  return <div className="s-social">{items.map(([k, label]) => <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={label}>{label}</a>)}</div>;
}

export function ContactList({ contact }) {
  const rows = [
    contact.address && ['pin', 'Address', <span style={{ whiteSpace: 'pre-line' }}>{contact.address}</span>],
    contact.phone && ['phone', 'Phone', <a href={telHref(contact.phone)}>{contact.phone}</a>],
    contact.email && ['mail', 'Email', <a href={`mailto:${contact.email}`}>{contact.email}</a>],
    contact.hours && ['clock', 'Office hours', contact.hours],
  ].filter(Boolean);
  if (!rows.length) return <p className="s-muted">Contact details will appear here soon.</p>;
  return (
    <ul className="s-contact">
      {rows.map(([icon, label, value]) => (
        <li key={label}><span className="s-ico"><Icon name={icon} size={20} /></span><div><small>{label}</small><div>{value}</div></div></li>
      ))}
    </ul>
  );
}

// Live, pannable and zoomable OpenStreetMap (no API key needed)
export function MapEmbed({ map, address }) {
  if (!map) {
    return (
      <div className="s-map empty">
        <Icon name="pin" size={28} />
        <p>The map appears here once the school location is set.</p>
        {address && <a className="s-btn s-btn-navy s-btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">Search the address on Google Maps</a>}
      </div>
    );
  }
  const { lat, lng } = map, d = 0.006;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d * 1.6}%2C${lat - d}%2C${lng + d * 1.6}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className="s-map">
      <iframe title="Map showing the school location" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="s-map-links">
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer">Get directions</a>
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noopener noreferrer">Open larger map</a>
      </div>
    </div>
  );
}

export const FacultyCard = ({ t, full }) => (
  <article className="s-card s-faculty s-reveal">
    {t.photo ? <img className="s-avatar" src={t.photo} alt={t.name} loading="lazy" /> : <span className="s-avatar" aria-hidden="true">{initialsOf(t.name)}</span>}
    <h3>{t.name}</h3>
    {t.designation && <p className="s-role">{t.designation}</p>}
    {t.qualification && <p className="s-muted small">{t.qualification}</p>}
    {t.subjects.length > 0 && <div className="s-tags">{t.subjects.map((s) => <span key={s} className="s-chip">{s}</span>)}</div>}
    {full && t.bio && <p className="s-bio">{t.bio}</p>}
  </article>
);

export const PostCard = ({ p, full }) => (
  <article className={`s-card s-post s-reveal ${full ? 'full' : ''}`}>
    {p.image && <img src={p.image} alt="" loading="lazy" />}
    <div className="s-post-body">
      <div className="s-meta"><span className={`s-tag ${p.type}`}>{p.type === 'event' ? 'Event' : 'News'}</span><time dateTime={p.date}>{fmtDate(p.date)}</time></div>
      <h3>{p.title}</h3>
      {p.body && <p className={full ? '' : 'clamp'}>{p.body}</p>}
    </div>
  </article>
);
