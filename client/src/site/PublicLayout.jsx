import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { initialsOf } from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { siteVars } from '../utils/themes.js';
import { SiteProvider, useSite } from './SiteContext.jsx';
import { Social, telHref } from './ui.jsx';

const LINKS = [['/', 'Home'], ['/about', 'About Us'], ['/faculty', 'Faculties'], ['/gallery', 'Gallery'], ['/news', 'News & Events'], ['/contact', 'Contact']];

function Logo({ site, size }) {
  return site.logo
    ? <img className="s-logo" style={size ? { width: size, height: size } : undefined} src={site.logo} alt="" />
    : <span className="s-logo mark" style={size ? { width: size, height: size } : undefined} aria-hidden="true">{initialsOf(site.schoolName)}</span>;
}

function Shell() {
  const { site, error } = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); setOpen(false); }, [pathname]);

  if (error) return <div className="site s-center"><p>The website is not available right now. Please try again in a few minutes.</p></div>;
  if (!site) return <div className="site s-center"><span className="s-spinner" role="status" aria-label="Loading" /></div>;
  const c = site.content;

  return (
    <div className="site" style={siteVars(site.theme?.site)}>
      <a className="s-skip" href="#main">Skip to content</a>
      {(c.contact.phone || c.contact.email || c.contact.hours) && (
        <div className="s-top">
          <div className="s-wrap">
            <div className="s-top-info">
              {c.contact.phone && <a href={telHref(c.contact.phone)}><Icon name="phone" size={14} /> {c.contact.phone}</a>}
              {c.contact.email && <a href={`mailto:${c.contact.email}`}><Icon name="mail" size={14} /> {c.contact.email}</a>}
              {c.contact.hours && <span className="s-hide-sm"><Icon name="clock" size={14} /> {c.contact.hours}</span>}
            </div>
            <Social social={c.social} />
          </div>
        </div>
      )}

      <header className="s-header">
        <div className="s-wrap">
          <Link to="/" className="s-brand"><Logo site={site} /><span>{site.schoolName}</span></Link>
          <button className="s-menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="s-nav" aria-label="Menu"><Icon name={open ? 'x' : 'menu'} size={24} /></button>
          <nav id="s-nav" className={`s-nav ${open ? 'open' : ''}`} aria-label="Main">
            {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
          </nav>
        </div>
      </header>

      <main id="main"><Outlet /></main>

      <footer className="s-footer">
        <div className="s-wrap s-foot-grid">
          <div>
            <Link to="/" className="s-brand light"><Logo site={site} /><span>{site.schoolName}</span></Link>
            <p className="s-foot-text">{c.footerText}</p>
            <Social social={c.social} />
          </div>
          <div>
            <h4>Quick links</h4>
            <ul>{LINKS.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              {c.contact.address && <li style={{ whiteSpace: 'pre-line' }}>{c.contact.address}</li>}
              {c.contact.phone && <li><a href={telHref(c.contact.phone)}>{c.contact.phone}</a></li>}
              {c.contact.email && <li><a href={`mailto:${c.contact.email}`}>{c.contact.email}</a></li>}
              {c.contact.hours && <li>{c.contact.hours}</li>}
            </ul>
          </div>
        </div>
        <div className="s-copy"><div className="s-wrap"><span>© {new Date().getFullYear()} {site.schoolName}. All rights reserved.</span></div></div>
      </footer>
    </div>
  );
}

export default function PublicLayout() {
  return <SiteProvider><Shell /></SiteProvider>;
}
