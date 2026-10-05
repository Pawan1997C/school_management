import { Router } from 'express';
import Enquiry from '../models/Enquiry.js';
import { protect, allow } from '../middleware/auth.js';
import { wrap } from '../utils/wrap.js';

const r = Router();
r.use(protect, allow('admin'));

r.get('/', wrap(async (req, res) => {
  const q = ['new', 'read'].includes(req.query.status) ? { status: req.query.status } : {};
  res.json(await Enquiry.find(q).sort('-createdAt').limit(500));
}));
r.put('/:id', wrap(async (req, res) => {
  const e = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status === 'new' ? 'new' : 'read' }, { new: true });
  e ? res.json(e) : res.status(404).json({ message: 'Not found' });
}));
r.delete('/:id', wrap(async (req, res) => { await Enquiry.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

export default r;
