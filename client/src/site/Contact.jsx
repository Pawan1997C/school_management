import { useState } from 'react';
import api, { errMsg } from '../api';
import { useSite } from './SiteContext.jsx';
import { ContactList, MapEmbed, PageHero, Social, useReveal } from './ui.jsx';

export default function Contact() {
  const { site } = useSite();
  const c = site.content;
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [st, setSt] = useState({ sending: false, done: false, error: '' });
  useReveal('contact');
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setSt({ sending: true, done: false, error: '' });
    try { await api.post('/public/enquiries', f); setF({ name: '', phone: '', email: '', message: '', website: '' }); setSt({ sending: false, done: true, error: '' }); }
    catch (err) { setSt({ sending: false, done: false, error: errMsg(err) }); }
  };

  return (
    <>
      <PageHero title="Contact Us" text="We would love to hear from you" />
      <section className="s-section">
        <div className="s-wrap s-two top">
          <div className="s-reveal">
            <span className="s-eyebrow">Get in touch</span>
            <h2>Visit, call or write to us</h2>
            <ContactList contact={c.contact} />
            <Social social={c.social} />
          </div>
          <form className="s-form s-reveal" onSubmit={submit}>
            <h3>Send an enquiry</h3>
            {st.done ? (
              <p className="s-note ok" role="status">Thank you! Your message has been sent. We will get back to you soon.</p>
            ) : (
              <>
                <label>Your name<input required minLength={2} maxLength={80} autoComplete="name" {...bind('name')} /></label>
                <div className="s-row2">
                  <label>Phone<input type="tel" maxLength={20} autoComplete="tel" {...bind('phone')} /></label>
                  <label>Email<input type="email" maxLength={120} autoComplete="email" {...bind('email')} /></label>
                </div>
                <label>Message<textarea required minLength={5} maxLength={1000} rows={5} {...bind('message')} /></label>
                <div className="s-hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" {...bind('website')} /></label></div>
                <p className="s-muted small">Please give a phone number or an email so we can reply.</p>
                {st.error && <p className="s-note bad" role="alert">{st.error}</p>}
                <button className="s-btn s-btn-gold" disabled={st.sending}>{st.sending ? 'Sending…' : 'Send message'}</button>
              </>
            )}
          </form>
        </div>
      </section>
      <section className="s-section soft">
        <div className="s-wrap">
          <div className="s-reveal"><MapEmbed map={site.map} address={c.contact.address} /></div>
        </div>
      </section>
    </>
  );
}
