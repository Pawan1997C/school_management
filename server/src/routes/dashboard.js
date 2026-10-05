import { Router } from 'express';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';
import Leave from '../models/LeaveRequest.js';
import TeacherAttendance from '../models/TeacherAttendance.js';
import StudentAttendance from '../models/StudentAttendance.js';
import { protect, allow } from '../middleware/auth.js';
import { getSettings } from './settings.js';
import { schoolNow } from '../utils/geo.js';
import { holidayOn } from '../utils/calendar.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect, allow('admin'));

r.get('/', wrap(async (req, res) => {
  const s = await getSettings();
  const { date } = schoolNow(s.timezone);
  const [teachers, students, classes, subjects, upcoming, today, regs, perClass, classDocs, leaveToday, pendingLeaves, off] = await Promise.all([
    Teacher.countDocuments(), Student.countDocuments(), Class.countDocuments(), Subject.countDocuments(),
    Exam.find({ date: { $gte: date } }).populate([{ path: 'class', select: 'name section' }, { path: 'subject', select: 'name' }]).sort('date').limit(5),
    TeacherAttendance.find({ date }).select('status'),
    StudentAttendance.find({ date }).select('records'),
    Student.aggregate([{ $group: { _id: '$class', n: { $sum: 1 } } }]),
    Class.find().sort('name section'),
    Leave.countDocuments({ status: 'approved', fromDate: { $lte: date }, toDate: { $gte: date } }),
    Leave.countDocuments({ status: 'pending' }),
    holidayOn(date, s),
  ]);
  const size = new Map(perClass.map((x) => [String(x._id), x.n]));
  const stu = { present: 0, late: 0, absent: 0 };
  regs.forEach((g) => g.records.forEach((x) => { stu[x.status] += 1; }));
  res.json({
    date, holiday: off?.name || null,
    counts: { teachers, students, classes, subjects, pendingLeaves },
    teachersToday: {
      present: today.filter((x) => x.status === 'present').length, late: today.filter((x) => x.status === 'late').length, leave: leaveToday,
      absent: off ? 0 : Math.max(teachers - today.length - leaveToday, 0),
    },
    studentsToday: { ...stu, registers: regs.length, classes },
    upcomingExams: upcoming.map((e) => ({ id: e._id, name: e.name, subject: e.subject?.name, class: e.class ? `${e.class.name} ${e.class.section}` : '', date: e.date, hasPaper: !!e.paper?.url })),
    classSizes: classDocs.map((c) => ({ id: c._id, name: `${c.name} ${c.section}`, students: size.get(String(c._id)) || 0 })),
  });
}));

export default r;
