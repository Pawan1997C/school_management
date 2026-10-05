import { Router } from 'express';
import StudentAttendance from '../models/StudentAttendance.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Assignment from '../models/PeriodAssignment.js';
import { protect, allow } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { schoolNow } from '../utils/geo.js';
import { holidayOn } from '../utils/calendar.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Admin: any class. Teacher: only classes they teach in the timetable.
const canTake = async (user, classId) => {
  if (user.role === 'admin') return true;
  const t = await Teacher.findOne({ user: user._id });
  return !!t && !!(await Assignment.exists({ teacher: t._id, class: classId }));
};

// Class register for a date. Students default to "present" until the teacher saves.
r.get('/', wrap(async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: 'Choose a class' });
  if (!(await canTake(req.user, classId))) return res.status(403).json({ message: 'You do not teach this class' });
  const s = await getSettings();
  const date = DATE.test(req.query.date || '') ? req.query.date : schoolNow(s.timezone).date;
  const [students, doc] = await Promise.all([Student.find({ class: classId }).sort('rollNo name'), StudentAttendance.findOne({ class: classId, date })]);
  const m = new Map((doc?.records || []).map((x) => [String(x.student), x.status]));
  res.json({
    date, saved: !!doc,
    rows: students.map((st) => ({ studentId: st._id, name: st.name, rollNo: st.rollNo, status: m.get(String(st._id)) || 'present' })),
  });
}));

r.put('/', allow('teacher'), wrap(async (req, res) => {
  const { classId, date, records } = req.body;
  if (!DATE.test(date || '')) return res.status(400).json({ message: 'Choose a valid date' });
  if (!(await canTake(req.user, classId))) return res.status(403).json({ message: 'You do not teach this class' });
  const s = await getSettings();
  if (date > schoolNow(s.timezone).date) return res.status(400).json({ message: 'You cannot take attendance for a future date' });
  const off = await holidayOn(date, s);
  if (off) return res.status(400).json({ message: `${date} is a holiday (${off.name}). No register is needed` });

  const valid = new Set((await Student.find({ class: classId }).select('_id')).map((x) => String(x._id)));
  const list = Array.isArray(records) ? records : [];
  if (list.some((x) => !valid.has(String(x.student)) || !['present', 'absent', 'late'].includes(x.status)))
    return res.status(400).json({ message: 'The attendance list has an invalid student or status' });

  const teacher = await Teacher.findOne({ user: req.user._id });
  await StudentAttendance.findOneAndUpdate(
    { class: classId, date },
    { class: classId, date, takenBy: teacher._id, records: list.map((x) => ({ student: x.student, status: x.status })) },
    { upsert: true, runValidators: true }
  );
  res.json({ ok: true });
}));

export default r;
