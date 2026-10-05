import { Router } from 'express';
import Leave from '../models/LeaveRequest.js';
import Teacher from '../models/Teacher.js';
import { protect, allow } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { schoolNow } from '../utils/geo.js';
import { daysBetween } from '../utils/calendar.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const out = (l) => ({ ...l.toObject(), days: daysBetween(l.fromDate, l.toDate) });
const me = (req) => Teacher.findOne({ user: req.user._id });
const bad = (res, message, status = 400) => res.status(status).json({ message });

// Teacher: apply
r.post('/', allow('teacher'), wrap(async (req, res) => {
  const { type, fromDate, toDate, reason } = req.body;
  if (!DATE.test(fromDate || '') || !DATE.test(toDate || '')) return bad(res, 'Choose valid dates');
  if (toDate < fromDate) return bad(res, 'The end date cannot be before the start date');
  if (!reason?.trim()) return bad(res, 'Please give a reason');
  const s = await getSettings();
  if (fromDate < schoolNow(s.timezone).date) return bad(res, 'Leave cannot start in the past');
  const t = await me(req);
  if (!t) return bad(res, 'Teacher profile not found', 404);
  const clash = await Leave.exists({ teacher: t._id, status: { $in: ['pending', 'approved'] }, fromDate: { $lte: toDate }, toDate: { $gte: fromDate } });
  if (clash) return bad(res, 'You already have a leave request covering some of those dates', 409);
  res.status(201).json(out(await Leave.create({ teacher: t._id, type, fromDate, toDate, reason: reason.trim() })));
}));

r.get('/mine', allow('teacher'), wrap(async (req, res) => {
  const t = await me(req);
  const list = t ? await Leave.find({ teacher: t._id }).sort('-fromDate') : [];
  res.json(list.map(out));
}));

// Teacher: cancel a pending request
r.delete('/:id', allow('teacher'), wrap(async (req, res) => {
  const t = await me(req);
  const l = t && (await Leave.findOne({ _id: req.params.id, teacher: t._id }));
  if (!l) return bad(res, 'Leave request not found', 404);
  if (l.status !== 'pending') return bad(res, 'Only pending requests can be cancelled');
  await l.deleteOne();
  res.json({ ok: true });
}));

// Admin: list and decide
r.get('/', allow('admin'), wrap(async (req, res) => {
  const q = ['pending', 'approved', 'rejected'].includes(req.query.status) ? { status: req.query.status } : {};
  const list = await Leave.find(q).populate('teacher', 'name photo').sort('-createdAt');
  res.json(list.map(out));
}));

r.put('/:id/review', allow('admin'), wrap(async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) return bad(res, 'Choose approve or reject');
  const l = await Leave.findById(req.params.id);
  if (!l) return bad(res, 'Leave request not found', 404);
  l.status = status;
  l.reviewNote = note?.trim() || undefined;
  l.reviewedAt = new Date();
  await l.save();
  res.json(out(l));
}));

export default r;
