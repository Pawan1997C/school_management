import { Router } from 'express';
import Teacher from '../models/Teacher.js';
import GalleryItem from '../models/GalleryItem.js';
import Post from '../models/Post.js';
import Enquiry from '../models/Enquiry.js';
import { getSettings } from './settings.js';
import { getContent } from './site.js';
import { wrap } from '../utils/wrap.js';

// No login needed: this feeds the public school website. Only safe fields are returned (no emails, phones or ids of staff).
const r = Router();
const url = (i) => i?.url || null;
const lim = (v, def, max) => Math.min(Math.max(parseInt(v, 10) || def, 1), max);

r.get('/site', wrap(async (req, res) => {
  const [s, c] = await Promise.all([getSettings(), getContent()]);
  const lat = c.contact?.lat ?? s.school?.lat, lng = c.contact?.lng ?? s.school?.lng; // map falls back to the school location in Settings
  res.json({
    schoolName: s.schoolName, logo: url(s.logo), theme: { site: s.theme?.site || 'royal', admin: s.theme?.admin || 'royal' },
    map: lat != null && lng != null ? { lat, lng } : null,
    content: {
      hero: { headline: c.hero.headline, subheadline: c.hero.subheadline, ctaText: c.hero.ctaText, ctaLink: c.hero.ctaLink, image: url(c.hero.image) },
      about: { title: c.about.title, body: c.about.body, mission: c.about.mission, vision: c.about.vision, image: url(c.about.image) },
      stats: c.stats.map((x) => ({ label: x.label, value: x.value })),
      principal: { name: c.principal.name, title: c.principal.title, message: c.principal.message, photo: url(c.principal.photo) },
      admissions: { open: c.admissions.open, headline: c.admissions.headline, text: c.admissions.text },
      contact: { address: c.contact.address, phone: c.contact.phone, email: c.contact.email, hours: c.contact.hours },
      social: { facebook: c.social.facebook, instagram: c.social.instagram, youtube: c.social.youtube, x: c.social.x },
      footerText: c.footerText,
    },
  });
}));

r.get('/faculty', wrap(async (req, res) => {
  const list = await Teacher.find({ showOnWebsite: { $ne: false } }).populate('subjects', 'name').sort('name').limit(lim(req.query.limit, 100, 200));
  res.json(list.map((t) => ({ id: t._id, name: t.name, photo: url(t.photo), designation: t.designation || '', qualification: t.qualification || '', bio: t.bio || '', subjects: t.subjects.map((x) => x.name) })));
}));

r.get('/gallery', wrap(async (req, res) => {
  const list = await GalleryItem.find().sort('-createdAt').limit(lim(req.query.limit, 100, 300));
  res.json(list.map((g) => ({ id: g._id, image: g.image.url, caption: g.caption || '', category: g.category || 'General' })));
}));

r.get('/posts', wrap(async (req, res) => {
  const q = ['news', 'event'].includes(req.query.type) ? { type: req.query.type } : {};
  const list = await Post.find(q).sort('-date').limit(lim(req.query.limit, 50, 100));
  res.json(list.map((p) => ({ id: p._id, title: p.title, type: p.type, date: p.date, body: p.body || '', image: url(p.image) })));
}));

// Enquiry form: honeypot field + a small per-IP limit to keep spam out
const hits = new Map();
const limited = (ip) => {
  const now = Date.now();
  if (hits.size > 2000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(ip);
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 3600000 }); return false; }
  h.n += 1;
  return h.n > 5;
};
r.post('/enquiries', wrap(async (req, res) => {
  const { name, phone, email, message, website } = req.body;
  if (website) return res.status(201).json({ ok: true }); // bots fill the hidden field; pretend it worked
  if (limited(req.ip)) return res.status(429).json({ message: 'Too many messages from this device. Please try again later.' });
  const n = String(name || '').trim(), m = String(message || '').trim(), p = String(phone || '').trim(), e = String(email || '').trim();
  if (n.length < 2) return res.status(400).json({ message: 'Please enter your name' });
  if (m.length < 5) return res.status(400).json({ message: 'Please write a short message' });
  if (!p && !e) return res.status(400).json({ message: 'Please give a phone number or an email so we can reply' });
  if (p && !/^[\d+\-() ]{6,20}$/.test(p)) return res.status(400).json({ message: 'Enter a valid phone number' });
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ message: 'Enter a valid email address' });
  await Enquiry.create({ name: n, phone: p, email: e, message: m });
  res.status(201).json({ ok: true });
}));

export default r;
