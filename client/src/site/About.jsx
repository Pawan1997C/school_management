import { initialsOf } from '../components/Avatar.jsx';
import { useSite } from './SiteContext.jsx';
import { PageHero, paras, useReveal } from './ui.jsx';

export default function About() {
  const { site } = useSite();
  const c = site.content;
  useReveal('about');
  return (
    <>
      <PageHero title="About Us" text={`Get to know ${site.schoolName}`} />
      <section className="s-section">
        <div className="s-wrap s-two">
          <div className="s-reveal">
            <span className="s-eyebrow">Our story</span>
            <h2>{c.about.title}</h2>
            {paras(c.about.body).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="s-frame s-reveal">{c.about.image ? <img src={c.about.image} alt="" loading="lazy" /> : <div className="s-frame-empty" aria-hidden="true" />}</div>
        </div>
      </section>

      {(c.about.mission || c.about.vision) && (
        <section className="s-section soft">
          <div className="s-wrap s-grid2">
            {c.about.mission && <div className="s-card s-mv s-reveal"><span className="s-eyebrow">Our mission</span><p>{c.about.mission}</p></div>}
            {c.about.vision && <div className="s-card s-mv s-reveal"><span className="s-eyebrow">Our vision</span><p>{c.about.vision}</p></div>}
          </div>
        </section>
      )}

      {c.stats.length > 0 && (
        <section className="s-section">
          <div className="s-wrap"><div className="s-stats flat s-reveal">{c.stats.map((s, i) => <div key={i}><b>{s.value}</b><span>{s.label}</span></div>)}</div></div>
        </section>
      )}

      {c.principal.message && (
        <section className="s-section soft">
          <div className="s-wrap s-principal s-reveal">
            {c.principal.photo ? <img className="s-pphoto" src={c.principal.photo} alt={c.principal.name || 'Principal'} loading="lazy" /> : <span className="s-pphoto" aria-hidden="true">{initialsOf(c.principal.name || 'Principal')}</span>}
            <blockquote>
              <span className="s-eyebrow">A message from the {c.principal.title || 'Principal'}</span>
              {paras(c.principal.message).map((p, i) => <p key={i}>{p}</p>)}
              <footer><b>{c.principal.name}</b>{c.principal.name && c.principal.title && <span> · {c.principal.title}</span>}</footer>
            </blockquote>
          </div>
        </section>
      )}
    </>
  );
}
