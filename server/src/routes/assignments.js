import { Router } from 'express';
import Assignment from '../models/PeriodAssignment.js';
import Teacher from '../models/Teacher.js';
import { protect, allow } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect);
const populate = [{ path: 'class', select: 'name section' }, { path: 'subject', select: 'name code' }, { path: 'teacher', select: 'name' }];

// Teacher: my own timetable
r.get('/mine', allow('teacher'), wrap(async (req, res) => {
  const t = await Teacher.findOne({ user: req.user._id });
  res.json(t ? await Assignment.find({ teacher: t._id }).populate(populate) : []);
}));

// Admin
r.get('/', allow('admin'), wrap(async (req, res) => {
  const q = {};
  if (req.query.classId) q.class = req.query.classId;
  if (req.query.teacherId) q.teacher = req.query.teacherId;
  res.json(await Assignment.find(q).populate(populate));
}));

// One period on several days at once. Days that clash are skipped and reported back.
r.post('/', allow('admin'), wrap(async (req, res) => {
  const { class: cls, subject, teacher, period } = req.body;
  const days = [...new Set([].concat(req.body.days ?? req.body.day ?? []))];
  if (!days.length) return res.status(400).json({ message: 'Choose at least one day' });

  const existing = await Assignment.find({ period, day: { $in: days }, $or: [{ class: cls }, { teacher }] });
  const classBusy = new Set(existing.filter((e) => String(e.class) === String(cls)).map((e) => e.day));
  const teacherBusy = new Set(existing.filter((e) => String(e.teacher) === String(teacher)).map((e) => e.day));
  const off = new Set((await getSettings()).weeklyOff || []);
  const free = days.filter((d) => !off.has(d) && !classBusy.has(d) && !teacherBusy.has(d));
  const skipped = days.filter((d) => !free.includes(d)).map((day) => ({ day, reason: off.has(day) ? 'weekly off' : classBusy.has(day) ? 'class already has a teacher' : 'teacher is teaching another class' }));

  const created = free.length ? await Assignment.insertMany(free.map((day) => ({ class: cls, subject, teacher, day, period }))) : [];
  res.status(201).json({ created: created.length, skipped });
}));

// ?allDays=1 removes the same class + period + teacher + subject on every day
r.delete('/:id', allow('admin'), wrap(async (req, res) => {
  const a = await Assignment.findById(req.params.id);
  if (a) {
    if (req.query.allDays === '1') await Assignment.deleteMany({ class: a.class, period: a.period, teacher: a.teacher, subject: a.subject });
    else await a.deleteOne();
  }
  res.json({ ok: true });
}));

export default r;
