import { Router } from 'express';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import { protect, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect, allow('teacher'));
const mine = (req) => Teacher.findOne({ user: req.user._id });

r.get('/', wrap(async (req, res) => {
  const t = await mine(req);
  if (!t) return res.status(404).json({ message: 'Teacher profile not found' });
  res.json(await t.populate('subjects', 'name'));
}));

// Teachers can edit their name, phone and photo. Email, employee id and subjects stay admin-managed.
r.put('/', upload.single('photo'), wrap(async (req, res) => {
  const t = await mine(req);
  if (!t) return res.status(404).json({ message: 'Teacher profile not found' });
  const { name, phone } = req.body;
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
    t.name = name.trim();
    req.user.name = t.name;
  }
  if (phone !== undefined) t.phone = phone.trim();
  if (req.body.removePhoto === 'true' && !req.file) { await deleteImage(t.photo?.publicId); t.set('photo', undefined); }
  if (req.file) {
    const old = t.photo?.publicId;
    t.photo = await uploadImage(req.file.buffer, 'teachers');
    await deleteImage(old);
  }
  await Promise.all([t.save(), req.user.save()]);
  res.json(await t.populate('subjects', 'name'));
}));

r.put('/password', wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
  const u = await User.findById(req.user._id).select('+password');
  if (!(await u.matches(currentPassword || ''))) return res.status(400).json({ message: 'Current password is incorrect' });
  u.password = newPassword;
  await u.save();
  res.json({ ok: true });
}));

export default r;
