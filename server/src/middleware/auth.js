import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { wrap } from '../utils/wrap.js';

export const protect = wrap(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id);
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again' });
  }
  if (!req.user) return res.status(401).json({ message: 'Account not found' });
  next();
});

export const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have access to this' });
