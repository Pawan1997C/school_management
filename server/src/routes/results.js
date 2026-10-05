import { Router } from 'express';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import Assignment from '../models/PeriodAssignment.js';
import StudentAttendance from '../models/StudentAttendance.js';
import { protect } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect);

const round1 = (n) => Math.round(n * 10) / 10;
const pct = (m, max) => (max ? round1((m / max) * 100) : 0);
const gradeOf = (p, pass) => (p < pass ? 'F' : p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 50 ? 'C' : 'D');
const deny = (res) => res.status(403).json({ message: 'You do not have access to this' });

// Admin sees everything. A teacher sees an exam they are assigned to (class + subject) and classes they teach.
const teacherId = async (user) => (await Teacher.findOne({ user: user._id }))?._id;
const canClass = async (user, classId) =>
  user.role === 'admin' || (async () => { const t = await teacherId(user); return !!t && !!(await Assignment.exists({ teacher: t, class: classId })); })();
const canExam = async (user, classId, subjectId) => {
  if (user.role === 'admin') return true;
  const t = await teacherId(user);
  return !!t && !!(await Assignment.exists({ teacher: t, class: classId, subject: subjectId }));
};

const status = (absent, has, percent, pass) => (absent ? 'absent' : has ? (percent >= pass ? 'pass' : 'fail') : 'pending');

// Results of one exam: every student, rank, and class statistics
r.get('/exam/:id', wrap(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate([{ path: 'class', select: 'name section' }, { path: 'subject', select: 'name code' }]);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  if (!(await canExam(req.user, exam.class._id, exam.subject._id))) return deny(res);

  const [settings, students, marks] = await Promise.all([getSettings(), Student.find({ class: exam.class._id }).sort('rollNo name'), Mark.find({ exam: exam._id })]);
  const pass = settings.passPercent ?? 33;
  const m = new Map(marks.map((x) => [String(x.student), x]));
  const rows = students.map((s) => {
    const x = m.get(String(s._id));
    const absent = !!x?.absent, has = !!x && x.marks != null && !absent;
    const percent = has ? pct(x.marks, exam.maxMarks) : null;
    return { studentId: s._id, name: s.name, rollNo: s.rollNo, marks: has ? x.marks : null, percent, grade: has ? gradeOf(percent, pass) : null, status: status(absent, has, percent, pass) };
  });
  const scored = rows.filter((x) => x.marks != null).sort((a, b) => b.marks - a.marks);
  scored.forEach((x, i) => { x.rank = i > 0 && x.marks === scored[i - 1].marks ? scored[i - 1].rank : i + 1; });
  const rest = rows.filter((x) => x.marks == null);
  const nums = scored.map((x) => x.marks);
  const passed = scored.filter((x) => x.status === 'pass').length;

  res.json({
    exam: { name: exam.name, class: exam.class, subject: exam.subject, date: exam.date, maxMarks: exam.maxMarks },
    passPercent: pass,
    stats: {
      students: rows.length, appeared: scored.length, passed, failed: scored.length - passed,
      absent: rest.filter((x) => x.status === 'absent').length, pending: rest.filter((x) => x.status === 'pending').length,
      average: nums.length ? round1(nums.reduce((a, b) => a + b, 0) / nums.length) : null,
      highest: nums.length ? Math.max(...nums) : null, lowest: nums.length ? Math.min(...nums) : null,
      passRate: scored.length ? round1((passed / scored.length) * 100) : null,
    },
    rows: [...scored, ...rest],
  });
}));

// Report card for one student: all exams, subject-wise totals, attendance
r.get('/student/:id', wrap(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!(await canClass(req.user, student.class))) return deny(res);

  const [settings, cls, exams, att] = await Promise.all([
    getSettings(),
    Class.findById(student.class).select('name section'),
    Exam.find({ class: student.class }).populate('subject', 'name code').sort('date'),
    StudentAttendance.aggregate([
      { $match: { class: student.class } }, { $unwind: '$records' }, { $match: { 'records.student': student._id } },
      { $group: { _id: '$records.status', n: { $sum: 1 } } },
    ]),
  ]);
  const pass = settings.passPercent ?? 33;
  const marks = await Mark.find({ student: student._id, exam: { $in: exams.map((e) => e._id) } });
  const m = new Map(marks.map((x) => [String(x.exam), x]));

  const rows = exams.map((e) => {
    const x = m.get(String(e._id));
    const absent = !!x?.absent, has = !!x && x.marks != null && !absent;
    const percent = has ? pct(x.marks, e.maxMarks) : null;
    return { examId: e._id, exam: e.name, subject: e.subject.name, date: e.date, maxMarks: e.maxMarks, marks: has ? x.marks : null, percent, grade: has ? gradeOf(percent, pass) : null, status: status(absent, has, percent, pass) };
  });
  const scored = rows.filter((x) => x.marks != null);
  const sum = (list, k) => list.reduce((a, b) => a + b[k], 0);
  const total = sum(scored, 'marks'), maxTotal = sum(scored, 'maxMarks');
  const overall = scored.length ? pct(total, maxTotal) : null;

  const bySubject = new Map();
  scored.forEach((x) => { const s = bySubject.get(x.subject) || { subject: x.subject, total: 0, maxTotal: 0 }; s.total += x.marks; s.maxTotal += x.maxMarks; bySubject.set(x.subject, s); });
  const subjects = [...bySubject.values()].map((s) => { const p = pct(s.total, s.maxTotal); return { ...s, percent: p, grade: gradeOf(p, pass) }; });

  const a = Object.fromEntries(att.map((x) => [x._id, x.n]));
  const days = (a.present || 0) + (a.late || 0) + (a.absent || 0);
  res.json({
    student: { id: student._id, name: student.name, rollNo: student.rollNo, guardianName: student.guardianName, photo: student.photo?.url },
    class: cls, passPercent: pass, rows, subjects,
    summary: { total, maxTotal, percent: overall, grade: overall == null ? null : gradeOf(overall, pass), examsScored: scored.length, examsTotal: rows.length },
    attendance: { present: a.present || 0, late: a.late || 0, absent: a.absent || 0, days, percent: days ? round1((((a.present || 0) + (a.late || 0)) / days) * 100) : null },
  });
}));

// Every student in a class: overall %, grade, rank, attendance %
r.get('/class/:classId', wrap(async (req, res) => {
  if (!(await canClass(req.user, req.params.classId))) return deny(res);
  const cls = await Class.findById(req.params.classId).select('name section');
  if (!cls) return res.status(404).json({ message: 'Class not found' });

  const [settings, students, exams, att] = await Promise.all([
    getSettings(),
    Student.find({ class: cls._id }).sort('rollNo name'),
    Exam.find({ class: cls._id }).select('maxMarks'),
    StudentAttendance.aggregate([
      { $match: { class: cls._id } }, { $unwind: '$records' },
      { $group: { _id: { s: '$records.student', st: '$records.status' }, n: { $sum: 1 } } },
    ]),
  ]);
  const pass = settings.passPercent ?? 33;
  const maxByExam = new Map(exams.map((e) => [String(e._id), e.maxMarks]));
  const marks = await Mark.find({ exam: { $in: exams.map((e) => e._id) } });

  const totals = new Map();
  marks.forEach((x) => {
    if (x.marks == null || x.absent) return;
    const t = totals.get(String(x.student)) || { total: 0, max: 0, taken: 0 };
    t.total += x.marks; t.max += maxByExam.get(String(x.exam)); t.taken += 1;
    totals.set(String(x.student), t);
  });
  const attMap = new Map();
  att.forEach((x) => { const k = String(x._id.s); const o = attMap.get(k) || { present: 0, late: 0, absent: 0 }; o[x._id.st] = x.n; attMap.set(k, o); });

  const rows = students.map((s) => {
    const t = totals.get(String(s._id)), a = attMap.get(String(s._id));
    const percent = t ? pct(t.total, t.max) : null;
    const days = a ? a.present + a.late + a.absent : 0;
    return {
      studentId: s._id, name: s.name, rollNo: s.rollNo, examsTaken: t?.taken || 0, total: t?.total ?? null, maxTotal: t?.max ?? null,
      percent, grade: percent == null ? null : gradeOf(percent, pass), attendancePercent: days ? round1(((a.present + a.late) / days) * 100) : null,
    };
  });
  const ranked = rows.filter((x) => x.percent != null).sort((a, b) => b.percent - a.percent);
  ranked.forEach((x, i) => { x.rank = i > 0 && x.percent === ranked[i - 1].percent ? ranked[i - 1].rank : i + 1; });
  res.json({ class: cls, passPercent: pass, examCount: exams.length, rows: [...ranked, ...rows.filter((x) => x.percent == null)] });
}));

export default r;
