import { Router } from 'express';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Assignment from '../models/PeriodAssignment.js';
import Attendance from '../models/TeacherAttendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { protect, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { wrap, asArray } from '../utils/wrap.js';

const r = Router();
r.use(protect, allow('admin'));

r.get('/', wrap(async (req, res) => res.json(await Teacher.find().populate('subjects', 'name code').sort('name'))));

r.post('/', upload.single('photo'), wrap(async (req, res) => {
  const { name, email, password, phone, employeeId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  const user = await User.create({ name, email, password, role: 'teacher' });
  let photo;
  try {
    photo = req.file ? await uploadImage(req.file.buffer, 'teachers') : undefined;
    res.status(201).json(await Teacher.create({ user: user._id, name, email, phone, employeeId, designation: req.body.designation, qualification: req.body.qualification, bio: req.body.bio, showOnWebsite: req.body.showOnWebsite !== 'false', subjects: asArray(req.body.subjects), photo }));
  } catch (e) {
    await user.deleteOne();
    await deleteImage(photo?.publicId);
    throw e;
  }
}));

r.put('/:id', upload.single('photo'), wrap(async (req, res) => {
  const t = await Teacher.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Teacher not found' });
  const { name, email, password, phone, employeeId } = req.body;
  Object.assign(t, { name, email, phone, employeeId, designation: req.body.designation, qualification: req.body.qualification, bio: req.body.bio, showOnWebsite: req.body.showOnWebsite !== 'false', subjects: asArray(req.body.subjects) });
  if (req.file) {
    const old = t.photo?.publicId;
    t.photo = await uploadImage(req.file.buffer, 'teachers');
    await deleteImage(old);
  }
  const user = await User.findById(t.user);
  user.name = name; user.email = email;
  if (password) user.password = password;
  await user.save();
  await t.save();
  res.json(t);
}));

r.delete('/:id', wrap(async (req, res) => {
  const t = await Teacher.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Teacher not found' });
  await Promise.all([
    Assignment.deleteMany({ teacher: t._id }),
    Attendance.deleteMany({ teacher: t._id }),
    LeaveRequest.deleteMany({ teacher: t._id }),
    User.findByIdAndDelete(t.user),
    deleteImage(t.photo?.publicId),
  ]);
  await t.deleteOne();
  res.json({ ok: true });
}));

export default r;
