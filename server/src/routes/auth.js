import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import { protect } from '../middleware/auth.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
const pub = async (u) => {
  const t = u.role === 'teacher' ? await Teacher.findOne({ user: u._id }).select('photo') : null;
  return { id: u._id, name: u.name, email: u.email, role: u.role, photo: t?.photo?.url || null };
};

r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: email.toLowerCase() }).select('+password'));
  if (!user || !(await user.matches(password || ''))) return res.status(401).json({ message: 'Email or password is incorrect' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
  res.json({ token, user: await pub(user) });
}));

r.get('/me', protect, wrap(async (req, res) => res.json(await pub(req.user))));

export default r;
