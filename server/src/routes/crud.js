import { Router } from 'express';
import { protect, allow } from '../middleware/auth.js';
import { wrap } from '../utils/wrap.js';

// Simple CRUD: any logged-in user can read, only admin can change.
export const crud = (Model, { sort = '', inUse } = {}) => {
  const r = Router();
  r.use(protect);
  r.get('/', wrap(async (req, res) => res.json(await Model.find().sort(sort))));
  r.post('/', allow('admin'), wrap(async (req, res) => res.status(201).json(await Model.create(req.body))));
  r.put('/:id', allow('admin'), wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    Object.assign(doc, req.body);
    res.json(await doc.save());
  }));
  r.delete('/:id', allow('admin'), wrap(async (req, res) => {
    if (inUse && (await inUse(req.params.id))) return res.status(409).json({ message: 'This is still in use. Remove its students or timetable entries first' });
    await Model.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }));
  return r;
};
