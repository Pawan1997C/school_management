import { Router } from 'express';
import SiteContent from '../models/SiteContent.js';
import { protect, allow } from '../middleware/auth.js';
import { siteUpload } from '../middleware/upload.js';
import { uploadPhoto, deleteImage } from '../utils/cloudinary.js';
import { cleanUrl } from '../utils/clean.js';
import { wrap } from '../utils/wrap.js';

export const getContent = async () => (await SiteContent.findOne()) || SiteContent.create({});

const TEXT = {
  hero: ['headline', 'subheadline', 'ctaText', 'ctaLink'],
  about: ['title', 'body', 'mission', 'vision'],
  principal: ['name', 'title', 'message'],
  admissions: ['headline', 'text'],
  contact: ['address', 'phone', 'email', 'hours'],
  social: ['facebook', 'instagram', 'youtube', 'x'],
};
const LINKS = new Set(['hero.ctaLink', 'social.facebook', 'social.instagram', 'social.youtube', 'social.x']);
const LONG = new Set(['body', 'message']);
const IMAGES = [['heroImage', 'hero.image'], ['aboutImage', 'about.image'], ['principalPhoto', 'principal.photo']];
const bad = (res, message) => res.status(400).json({ message });

const r = Router();
r.use(protect, allow('admin'));

r.get('/', wrap(async (req, res) => res.json(await getContent())));

// multipart: `content` (JSON string of the text fields) plus optional image files
r.put('/', siteUpload.fields(IMAGES.map(([name]) => ({ name, maxCount: 1 }))), wrap(async (req, res) => {
  let c;
  try { c = JSON.parse(req.body.content || '{}'); } catch { return bad(res, 'Invalid content'); }
  const s = await getContent();

  for (const [sec, keys] of Object.entries(TEXT)) {
    for (const k of keys) {
      const raw = c[sec]?.[k];
      if (raw === undefined) continue;
      let v = String(raw).trim().slice(0, LONG.has(k) ? 5000 : 300);
      if (LINKS.has(`${sec}.${k}`)) {
        v = cleanUrl(v, sec === 'hero');
        if (v === null) return bad(res, `Enter a full link starting with https:// for ${sec} ${k}`);
      }
      s.set(`${sec}.${k}`, v);
    }
  }
  if (c.admissions?.open !== undefined) s.set('admissions.open', !!c.admissions.open);
  if (c.footerText !== undefined) s.footerText = String(c.footerText).trim().slice(0, 200);
  if (Array.isArray(c.stats)) {
    s.stats = c.stats.slice(0, 6).map((x) => ({ label: String(x.label || '').trim().slice(0, 40), value: String(x.value || '').trim().slice(0, 20) })).filter((x) => x.label || x.value);
  }
  for (const k of ['lat', 'lng']) {
    if (c.contact && k in c.contact) {
      const raw = c.contact[k];
      const n = raw === '' || raw == null ? undefined : Number(raw);
      if (n !== undefined && !Number.isFinite(n)) return bad(res, 'Map latitude and longitude must be numbers');
      s.set(`contact.${k}`, n);
    }
  }

  const remove = Array.isArray(c.remove) ? c.remove : [];
  for (const [field, path] of IMAGES) {
    const file = req.files?.[field]?.[0];
    const old = s.get(path)?.publicId;
    if (file) { s.set(path, await uploadPhoto(file.buffer, 'website')); await deleteImage(old); }
    else if (remove.includes(path)) { s.set(path, undefined); await deleteImage(old); }
  }
  res.json(await s.save());
}));

export default r;
