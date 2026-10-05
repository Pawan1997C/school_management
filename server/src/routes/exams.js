import { Router } from 'express';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Assignment from '../models/PeriodAssignment.js';
import { protect, allow } from '../middleware/auth.js';
import { paperUpload } from '../middleware/upload.js';
import { uploadFile, deleteFile } from '../utils/cloudinary.js';
import { getSettings } from './settings.js';
import { schoolNow } from '../utils/geo.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect);
const populate = [{ path: 'class', select: 'name section' }, { path: 'subject', select: 'name code' }];
const pick = (b) => ({ name: b.name, class: b.class, subject: b.subject, date: b.date, maxMarks: b.maxMarks });

// Admin: any exam. Teacher: only exams for a class + subject they are assigned to in the timetable.
const canAccess = async (user, exam) => {
  if (user.role === 'admin') return true;
  const t = await Teacher.findOne({ user: user._id });
  return !!t && !!(await Assignment.exists({ teacher: t._id, class: exam.class, subject: exam.subject }));
};
const getExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) { res.status(404).json({ message: 'Exam not found' }); return null; }
  if (!(await canAccess(req.user, exam))) { res.status(403).json({ message: 'You are not assigned to this class and subject' }); return null; }
  return exam;
};

r.get('/', wrap(async (req, res) => {
  let q = {};
  if (req.user.role === 'teacher') {
    const t = await Teacher.findOne({ user: req.user._id });
    const as = t ? await Assignment.find({ teacher: t._id }).select('class subject') : [];
    const pairs = [...new Map(as.map((a) => [`${a.class}-${a.subject}`, { class: a.class, subject: a.subject }])).values()];
    if (!pairs.length) return res.json([]);
    q = { $or: pairs };
  } else if (req.query.classId) q.class = req.query.classId;
  res.json(await Exam.find(q).populate(populate).sort('-date'));
}));

// Admin: schedule and manage exams
r.post('/', allow('admin'), wrap(async (req, res) => res.status(201).json(await Exam.create(pick(req.body)))));

r.put('/:id', allow('admin'), wrap(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  if (String(exam.class) !== String(req.body.class)) await Mark.deleteMany({ exam: exam._id }); // different class = different students
  Object.assign(exam, pick(req.body));
  res.json(await exam.save());
}));

r.delete('/:id', allow('admin'), wrap(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (exam) {
    await Promise.all([Mark.deleteMany({ exam: exam._id }), deleteFile(exam.paper)]);
    await exam.deleteOne();
  }
  res.json({ ok: true });
}));

// Teacher (or admin): upload / replace the test paper
r.post('/:id/paper', paperUpload.single('paper'), wrap(async (req, res) => {
  const exam = await getExam(req, res);
  if (!exam) return;
  if (!req.file) return res.status(400).json({ message: 'Choose a PDF or image to upload' });
  const old = exam.paper;
  exam.paper = await uploadFile(req.file.buffer, 'papers', req.file.originalname);
  await exam.save();
  await deleteFile(old);
  res.json(exam);
}));

// Scores: every student in the class with their current mark
r.get('/:id/marks', wrap(async (req, res) => {
  const exam = await getExam(req, res);
  if (!exam) return;
  const [students, marks] = await Promise.all([Student.find({ class: exam.class }).sort('rollNo name'), Mark.find({ exam: exam._id })]);
  const m = new Map(marks.map((x) => [String(x.student), x]));
  res.json({
    maxMarks: exam.maxMarks,
    rows: students.map((s) => ({ studentId: s._id, name: s.name, photo: s.photo?.url || null, rollNo: s.rollNo, marks: m.get(String(s._id))?.marks ?? null, absent: m.get(String(s._id))?.absent ?? false })),
  });
}));

r.put('/:id/marks', allow('teacher'), wrap(async (req, res) => {
  const exam = await getExam(req, res);
  if (!exam) return;
  const s = await getSettings();
  if (exam.date > schoolNow(s.timezone).date) return res.status(400).json({ message: `Scores can be entered from the exam date (${exam.date})` });

  const valid = new Set((await Student.find({ class: exam.class }).select('_id')).map((x) => String(x._id)));
  const ops = [];
  for (const row of Array.isArray(req.body.scores) ? req.body.scores : []) {
    if (!valid.has(String(row.student))) return res.status(400).json({ message: 'A student in the list is not in this class' });
    const absent = !!row.absent;
    const marks = absent || row.marks === '' || row.marks == null ? null : Number(row.marks);
    if (marks !== null && (!Number.isFinite(marks) || marks < 0 || marks > exam.maxMarks))
      return res.status(400).json({ message: `Marks must be between 0 and ${exam.maxMarks}` });
    ops.push({ updateOne: { filter: { exam: exam._id, student: row.student }, update: { $set: { marks, absent } }, upsert: true } });
  }
  if (ops.length) await Mark.bulkWrite(ops);
  res.json({ ok: true });
}));

export default r;
