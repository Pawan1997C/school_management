import { Router } from 'express';
import Student from '../models/Student.js';
import Mark from '../models/Mark.js';
import { protect, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect, allow('admin'));
const fields = ['name', 'rollNo', 'class', 'guardianName', 'guardianPhone'];
const pick = (b) => Object.fromEntries(fields.map((f) => [f, b[f]]));
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/students?classId=&q=&page=&limit=   (without `page` it returns a plain array)
r.get('/', wrap(async (req, res) => {
  const q = {};
  if (req.query.classId) q.class = req.query.classId;
  const term = (req.query.q || '').trim();
  if (term) { const rx = new RegExp(escapeRx(term), 'i'); q.$or = [{ name: rx }, { rollNo: rx }, { guardianName: rx }]; }
  const find = () => {
    const c = Student.find(q).populate('class', 'name section');
    return req.query.classId ? c.collation({ locale: 'en', numericOrdering: true }).sort({ rollNo: 1 }) : c.sort('name');
  };
  if (!req.query.page) return res.json(await find());

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const total = await Student.countDocuments(q);
  const pages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages);
  res.json({ items: await find().skip((page - 1) * limit).limit(limit), total, page, pages, limit });
}));

r.get('/:id', wrap(async (req, res) => {
  const s = await Student.findById(req.params.id).populate('class', 'name section');
  s ? res.json(s) : res.status(404).json({ message: 'Student not found' });
}));

r.post('/', upload.single('photo'), wrap(async (req, res) => {
  const photo = req.file ? await uploadImage(req.file.buffer, 'students') : undefined;
  try { res.status(201).json(await Student.create({ ...pick(req.body), photo })); }
  catch (e) { await deleteImage(photo?.publicId); throw e; }
}));

r.put('/:id', upload.single('photo'), wrap(async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ message: 'Student not found' });
  Object.assign(s, pick(req.body));
  if (req.file) {
    const old = s.photo?.publicId;
    s.photo = await uploadImage(req.file.buffer, 'students');
    await deleteImage(old);
  }
  res.json(await s.save());
}));

r.delete('/:id', wrap(async (req, res) => {
  const s = await Student.findByIdAndDelete(req.params.id);
  if (s) await Promise.all([deleteImage(s.photo?.publicId), Mark.deleteMany({ student: s._id })]);
  res.json({ ok: true });
}));

export default r;
