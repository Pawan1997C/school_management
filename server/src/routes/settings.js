import { Router } from 'express';
import Settings, { DEFAULT_PERIODS, THEME_IDS } from '../models/Settings.js';
import Assignment from '../models/PeriodAssignment.js';
import { protect, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLogo, deleteImage } from '../utils/cloudinary.js';
import { wrap } from '../utils/wrap.js';

export const getSettings = async () => (await Settings.findOne()) || Settings.create({});
export const periodsOf = (s) => (s.periods?.length ? s.periods.map((p) => ({ number: p.number, start: p.start, end: p.end })) : DEFAULT_PERIODS);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const bad = (res, message, status = 400) => res.status(status).json({ message });
const parse = (v) => { try { return JSON.parse(v); } catch { return undefined; } };

const r = Router();

// Any logged-in user: branding and period timings (used by the sidebar, timetable, teacher home)
r.get('/public', protect, wrap(async (req, res) => {
  const s = await getSettings();
  res.json({ schoolName: s.schoolName, logo: s.logo?.url || null, periods: periodsOf(s), weeklyOff: s.weeklyOff, theme: { site: s.theme?.site || 'royal', admin: s.theme?.admin || 'royal' } });
}));

r.use(protect, allow('admin'));

r.get('/', wrap(async (req, res) => {
  const s = await getSettings();
  res.json({ ...s.toObject(), periods: periodsOf(s) });
}));

r.put('/', upload.single('logo'), wrap(async (req, res) => {
  const s = await getSettings();
  const b = req.body;

  if (b.schoolName !== undefined) {
    if (!b.schoolName.trim()) return bad(res, 'School name cannot be empty');
    s.schoolName = b.schoolName.trim();
  }
  if (b.lat !== undefined && b.lat !== '' && b.lng !== undefined && b.lng !== '') s.school = { lat: Number(b.lat), lng: Number(b.lng) };
  if (b.radiusMeters) s.radiusMeters = Number(b.radiusMeters);
  if (b.lateAfter) s.lateAfter = b.lateAfter;
  if (b.checkOutFrom) {
    if (!TIME.test(b.checkOutFrom)) return bad(res, 'Use a valid check-out time');
    s.checkOutFrom = b.checkOutFrom;
  }
  if (s.checkOutFrom <= s.lateAfter) return bad(res, 'The check-out time must be later than the late-after time');
  if (b.timezone) s.timezone = b.timezone;
  if (b.passPercent) s.passPercent = Number(b.passPercent);

  if (b.weeklyOff !== undefined) {
    const list = parse(b.weeklyOff);
    if (!Array.isArray(list)) return bad(res, 'Invalid weekly off days');
    s.weeklyOff = list.filter((d) => DAYS.includes(d));
  }

  if (b.periods !== undefined) {
    const list = parse(b.periods);
    if (!Array.isArray(list) || !list.length || list.length > 12) return bad(res, 'Add between 1 and 12 periods');
    if (list.some((p) => !TIME.test(p.start) || !TIME.test(p.end) || p.start >= p.end)) return bad(res, 'Each period needs a start time earlier than its end time');
    if (list.some((p, i) => i > 0 && p.start < list[i - 1].end)) return bad(res, 'Periods cannot overlap');
    if (list.length < periodsOf(s).length && (await Assignment.exists({ period: { $gt: list.length } })))
      return bad(res, `Remove the timetable entries for period ${list.length + 1} onward before deleting those periods`, 409);
    s.periods = list.map((p, i) => ({ number: i + 1, start: p.start, end: p.end }));
  }

  for (const [field, path] of [['themeSite', 'theme.site'], ['themeAdmin', 'theme.admin']]) {
    if (b[field] === undefined) continue;
    if (!THEME_IDS.includes(b[field])) return bad(res, 'Choose one of the listed themes');
    s.set(path, b[field]);
  }

  if (b.removeLogo === 'true' && !req.file) { await deleteImage(s.logo?.publicId); s.set('logo', undefined); }
  if (req.file) {
    const old = s.logo?.publicId;
    s.logo = await uploadLogo(req.file.buffer);
    await deleteImage(old);
  }
  await s.save();
  res.json({ ...s.toObject(), periods: periodsOf(s) });
}));

export default r;
