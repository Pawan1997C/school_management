import { Router } from 'express';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/TeacherAttendance.js';
import Leave from '../models/LeaveRequest.js';
import { protect, allow } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { distanceMeters, schoolNow } from '../utils/geo.js';
import { holidayOn } from '../utils/calendar.js';
import { fmt12 } from '../utils/time.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect);
const me = (req) => Teacher.findOne({ user: req.user._id });
const onLeave = (teacher, date) => Leave.exists({ teacher, status: 'approved', fromDate: { $lte: date }, toDate: { $gte: date } });
const cutoff = (s) => s.checkOutFrom || '14:00'; // check-in closes and check-out opens at this time
const point = (b) => ({ lat: Number(b.lat), lng: Number(b.lng), accuracy: Number(b.accuracy) || undefined });
const bad = (res, message, status = 400) => res.status(status).json({ message });

// Teacher: today's state (holiday, leave, and whether check-out is open yet)
r.get('/status', allow('teacher'), wrap(async (req, res) => {
  const s = await getSettings();
  const { date, time } = schoolNow(s.timezone);
  const [t, off] = [await me(req), await holidayOn(date, s)];
  res.json({ date, holiday: off?.name || null, onLeave: t ? !!(await onLeave(t._id, date)) : false, checkOutFrom: cutoff(s), checkOutOpen: time >= cutoff(s) });
}));

// Teacher: daily check-in (before the cut-off), validated against the school location on the server
r.post('/check-in', allow('teacher'), wrap(async (req, res) => {
  const p = point(req.body);
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return bad(res, 'Location is required to check in');
  const teacher = await me(req);
  if (!teacher) return bad(res, 'Teacher profile not found', 404);
  const s = await getSettings();
  if (s.school?.lat == null) return bad(res, 'School location is not set yet. Ask the admin to set it');

  const { date, time } = schoolNow(s.timezone);
  const off = await holidayOn(date, s);
  if (off) return bad(res, `Today is a holiday (${off.name}). No check-in needed`);
  if (await onLeave(teacher._id, date)) return bad(res, 'You are on approved leave today');
  if (time >= cutoff(s)) return bad(res, `Check-in closed at ${fmt12(cutoff(s))}`);

  const distance = Math.round(distanceMeters(p.lat, p.lng, s.school.lat, s.school.lng));
  if (distance > s.radiusMeters) return bad(res, `You are ${distance} m from school. Check-in works within ${s.radiusMeters} m`, 403);

  const rec = await Attendance.create({
    teacher: teacher._id, date, checkInAt: new Date(), location: p,
    distanceFromSchool: distance, status: time > s.lateAfter ? 'late' : 'present',
  });
  res.status(201).json(rec);
}));

// Teacher: check-out, only after the cut-off, only if checked in, and from inside the school radius
r.post('/check-out', allow('teacher'), wrap(async (req, res) => {
  const p = point(req.body);
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return bad(res, 'Location is required to check out');
  const teacher = await me(req);
  if (!teacher) return bad(res, 'Teacher profile not found', 404);
  const s = await getSettings();
  if (s.school?.lat == null) return bad(res, 'School location is not set yet. Ask the admin to set it');

  const { date, time } = schoolNow(s.timezone);
  const rec = await Attendance.findOne({ teacher: teacher._id, date });
  if (!rec) return bad(res, 'You have not checked in today');
  if (rec.checkOutAt) return bad(res, 'You have already checked out today', 409);
  if (time < cutoff(s)) return bad(res, `Check-out opens at ${fmt12(cutoff(s))}`);

  const distance = Math.round(distanceMeters(p.lat, p.lng, s.school.lat, s.school.lng));
  if (distance > s.radiusMeters) return bad(res, `You are ${distance} m from school. Check-out works within ${s.radiusMeters} m`, 403);

  rec.checkOutAt = new Date();
  rec.checkOutLocation = p;
  rec.checkOutDistance = distance;
  await rec.save();
  res.json(rec);
}));

r.get('/today', allow('teacher'), wrap(async (req, res) => {
  const [t, s] = [await me(req), await getSettings()];
  res.json(t ? await Attendance.findOne({ teacher: t._id, date: schoolNow(s.timezone).date }) : null);
}));

r.get('/mine', allow('teacher'), wrap(async (req, res) => {
  const t = await me(req);
  res.json(t ? await Attendance.find({ teacher: t._id }).sort('-date').limit(30) : []);
}));

// Admin: every teacher for a date. No record = holiday, leave or absent.
r.get('/', allow('admin'), wrap(async (req, res) => {
  const s = await getSettings();
  const date = req.query.date || schoolNow(s.timezone).date;
  const [teachers, records, leaves, off] = await Promise.all([
    Teacher.find().sort('name'), Attendance.find({ date }),
    Leave.find({ status: 'approved', fromDate: { $lte: date }, toDate: { $gte: date } }).select('teacher'),
    holidayOn(date, s),
  ]);
  const byTeacher = new Map(records.map((x) => [String(x.teacher), x]));
  const away = new Set(leaves.map((l) => String(l.teacher)));
  res.json({
    date, holiday: off?.name || null,
    rows: teachers.map((t) => {
      const a = byTeacher.get(String(t._id));
      return {
        teacherId: t._id, name: t.name, status: a?.status || (off ? 'holiday' : away.has(String(t._id)) ? 'leave' : 'absent'),
        checkInAt: a?.checkInAt, checkOutAt: a?.checkOutAt, distance: a?.distanceFromSchool,
      };
    }),
  });
}));

export default r;
