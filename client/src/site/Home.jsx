import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { initialsOf } from '../components/Avatar.jsx';
import { useSite } from './SiteContext.jsx';
import { ContactList, FacultyCard, Head, MapEmbed, PostCard, SmartLink, paras, useReveal } from './ui.jsx';

export default function Home() {
  const { site } = useSite();
  const c = site.content;
  const [faculty, setFaculty] = useState([]);
  const [posts, setPosts] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    api.get('/public/faculty', { params: { limit: 4 } }).then((r) => setFaculty(r.data)).catch(() => {});
    api.get('/public/posts', { params: { limit: 3 } }).then((r) => setPosts(r.data)).catch(() => {});
    api.get('/public/gallery', { params: { limit: 6 } }).then((r) => setGallery(r.data)).catch(() => {});
  }, []);
  useReveal(`${faculty.length}-${posts.length}-${gallery.length}`);

  return (
    <>
      <section className="s-hero" style={c.hero.image ? { '--hero-img': `url("${c.hero.image}")` } : undefined}>
        <div className="s-wrap s-hero-in">
          {c.admissions.open && <span className="s-pill">{c.admissions.headline}</span>}
          <h1>{c.hero.headline}</h1>
          <p>{c.hero.subheadline}</p>
          <div className="s-actions">
            {c.hero.ctaText && <SmartLink to={c.hero.ctaLink || '/contact'} className="s-btn s-btn-gold">{c.hero.ctaText}</SmartLink>}
            <Link to="/about" className="s-btn s-btn-ghost">Discover our school</Link>
          </div>
        </div>
      </section>

      {c.stats.length > 0 && (
        <div className="s-wrap">
          <div className="s-stats s-reveal">
            {c.stats.map((s, i) => <div key={i}><b>{s.value}</b><span>{s.label}</span></div>)}
          </div>
        </div>
      )}

      <section className="s-section">
        <div className="s-wrap s-two">
          <div className="s-reveal">
            <span className="s-eyebrow">Who we are</span>
            <h2>{c.about.title}</h2>
            {paras(c.about.body).slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
            <Link to="/about" className="s-btn s-btn-navy">Read our story</Link>
          </div>
          <div className="s-frame s-reveal">{c.about.image ? <img src={c.about.image} alt="" loading="lazy" /> : <div className="s-frame-empty" aria-hidden="true" />}</div>
        </div>
      </section>

      {c.principal.message && (
        <section className="s-section soft">
          <div className="s-wrap s-principal s-reveal">
            {c.principal.photo ? <img className="s-pphoto" src={c.principal.photo} alt={c.principal.name || 'Principal'} loading="lazy" /> : <span className="s-pphoto" aria-hidden="true">{initialsOf(c.principal.name || 'Principal')}</span>}
            <blockquote>
              <span className="s-eyebrow">A message from the {c.principal.title || 'Principal'}</span>
              {paras(c.principal.message).slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
              <footer><b>{c.principal.name}</b>{c.principal.name && c.principal.title && <span> · {c.principal.title}</span>}</footer>
            </blockquote>
          </div>
        </section>
      )}

      {faculty.length > 0 && (
        <section className="s-section">
          <div className="s-wrap">
            <Head eyebrow="Our teachers" title="Meet the faculty" text="Experienced, caring educators who know every child by name." center />
            <div className="s-grid4">{faculty.map((t) => <FacultyCard key={t.id} t={t} />)}</div>
            <div className="s-more"><Link to="/faculty" className="s-btn s-btn-navy">See all faculty</Link></div>
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="s-section soft">
          <div className="s-wrap">
            <Head eyebrow="What's happening" title="News and events" center />
            <div className="s-grid3">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
            <div className="s-more"><Link to="/news" className="s-btn s-btn-navy">All news and events</Link></div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="s-section">
          <div className="s-wrap">
            <Head eyebrow="Life at school" title="From our gallery" center />
            <div className="s-gal">
              {gallery.map((g) => <Link key={g.id} to="/gallery" className="s-gal-item s-reveal"><img src={g.image} alt={g.caption || 'School photo'} loading="lazy" /></Link>)}
            </div>
            <div className="s-more"><Link to="/gallery" className="s-btn s-btn-navy">View full gallery</Link></div>
          </div>
        </section>
      )}

      {c.admissions.open && (
        <section className="s-band">
          <div className="s-wrap s-band-in">
            <div><h2>{c.admissions.headline}</h2><p>{c.admissions.text}</p></div>
            <Link to="/contact" className="s-btn s-btn-navy">Enquire now</Link>
          </div>
        </section>
      )}

      <section className="s-section">
        <div className="s-wrap s-two">
          <div className="s-reveal">
            <span className="s-eyebrow">Find us</span>
            <h2>Visit our campus</h2>
            <ContactList contact={c.contact} />
          </div>
          <div className="s-reveal"><MapEmbed map={site.map} address={c.contact.address} /></div>
        </div>
      </section>
    </>
  );
}
