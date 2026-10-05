import { Router } from 'express';
import mongoose from 'mongoose';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Holiday from '../models/Holiday.js';
import Leave from '../models/LeaveRequest.js';
import TeacherAttendance from '../models/TeacherAttendance.js';
import StudentAttendance from '../models/StudentAttendance.js';
import { protect, allow } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { schoolNow } from '../utils/geo.js';
import { isMonth, prevMonthOf, dayBefore, workingDates, teacherMonth, studentMonth, totals, delta } from '../utils/report.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect, allow('admin'));
const bad = (res, message) => res.status(400).json({ message });
const groupBy = (list) => list.reduce((m, x) => m.set(String(x.teacher), [...(m.get(String(x.teacher)) || []), x]), new Map());

// GET /api/reports/attendance?type=teachers|students&month=YYYY-MM[&classId=...]
r.get('/attendance', wrap(async (req, res) => {
  const { type, month, classId } = req.query;
  if (!['teachers', 'students'].includes(type)) return bad(res, 'Choose teachers or students');
  if (!isMonth(month)) return bad(res, 'Choose a valid month');
  const s = await getSettings();
  const { date: today } = schoolNow(s.timezone);
  if (month > today.slice(0, 7)) return bad(res, 'Choose the current month or an earlier one');
  const prev = prevMonthOf(month);
  const from = `${prev}-01`, to = `${month}-31`;

  if (type === 'teachers') {
    const limit = month === today.slice(0, 7) ? dayBefore(today) : undefined; // today is still in progress
    const [teachers, holidays, recs, leaves] = await Promise.all([
      Teacher.find().sort('name'),
      Holiday.find({ endDate: { $gte: from }, startDate: { $lte: to } }),
      TeacherAttendance.find({ date: { $gte: from, $lte: to } }).select('teacher date status'),
      Leave.find({ status: 'approved', fromDate: { $lte: to }, toDate: { $gte: from } }).select('teacher fromDate toDate'),
    ]);
    const opts = { weeklyOff: s.weeklyOff, holidays };
    const curDays = workingDates(month, { ...opts, limit }), prevDays = workingDates(prev, opts);
    const recBy = groupBy(recs), leaveBy = groupBy(leaves);

    const rows = teachers.map((t) => {
      const id = String(t._id), join = schoolNow(s.timezone, t.createdAt).date; // no absences before the teacher was added
      const cur = teacherMonth(curDays, join, recBy.get(id) || [], leaveBy.get(id) || []);
      const pr = teacherMonth(prevDays, join, recBy.get(id) || [], leaveBy.get(id) || []);
      return { id, name: t.name, photo: t.photo?.url || null, ...cur, prev: pr, change: delta(cur.percent, pr.percent) };
    });
    const cur = totals(rows), pr = totals(rows.map((x) => x.prev));
    return res.json({ type, month, prevMonth: prev, countedThrough: limit || null, summary: { workingDays: curDays.length, prevWorkingDays: prevDays.length, cur, prev: pr, change: delta(cur.percent, pr.percent) }, rows });
  }

  if (classId && !mongoose.isValidObjectId(classId)) return bad(res, 'Invalid class');
  const match = { date: { $gte: from, $lte: to } };
  if (classId) match.class = new mongoose.Types.ObjectId(classId);
  const [students, agg] = await Promise.all([
    Student.find(classId ? { class: classId } : {}).populate('class', 'name section'),
    StudentAttendance.aggregate([
      { $match: match }, { $unwind: '$records' },
      { $group: { _id: { s: '$records.student', m: { $substrCP: ['$date', 0, 7] }, st: '$records.status' }, n: { $sum: 1 } } },
    ]),
  ]);
  const tally = new Map();
  agg.forEach((x) => {
    const k = `${x._id.s}|${x._id.m}`;
    tally.set(k, { ...(tally.get(k) || {}), [x._id.st]: x.n });
  });
  const rows = students.map((st) => {
    const cur = studentMonth(tally.get(`${st._id}|${month}`)), pr = studentMonth(tally.get(`${st._id}|${prev}`));
    return { id: String(st._id), name: st.name, rollNo: st.rollNo, class: st.class ? `${st.class.name} ${st.class.section}` : '', ...cur, prev: pr, change: delta(cur.percent, pr.percent) };
  }).sort((a, b) => a.class.localeCompare(b.class) || a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  const cur = totals(rows), pr = totals(rows.map((x) => x.prev));
  res.json({ type, month, prevMonth: prev, countedThrough: null, summary: { cur, prev: pr, change: delta(cur.percent, pr.percent) }, rows });
}));

export default r;
