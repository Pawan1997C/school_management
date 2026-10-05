import { Router } from 'express';
import { protect, allow } from '../middleware/auth.js';
import { siteUpload } from '../middleware/upload.js';
import { uploadPhoto, deleteImage } from '../utils/cloudinary.js';
import { wrap } from '../utils/wrap.js';

// Admin CRUD for a collection with one image (gallery items, news posts)
export const mediaCrud = (Model, { folder, fields, sort, imageRequired = false }) => {
  const r = Router();
  r.use(protect, allow('admin'));
  const pick = (b) => Object.fromEntries(fields.map((f) => [f, b[f]]));

  r.get('/', wrap(async (req, res) => res.json(await Model.find().sort(sort))));

  r.post('/', siteUpload.single('image'), wrap(async (req, res) => {
    if (imageRequired && !req.file) return res.status(400).json({ message: 'Choose an image to upload' });
    const image = req.file ? await uploadPhoto(req.file.buffer, folder) : undefined;
    try { res.status(201).json(await Model.create({ ...pick(req.body), image })); }
    catch (e) { await deleteImage(image?.publicId); throw e; }
  }));

  r.put('/:id', siteUpload.single('image'), wrap(async (req, res) => {
    const d = await Model.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Not found' });
    Object.assign(d, pick(req.body));
    if (req.file) {
      const old = d.image?.publicId;
      d.image = await uploadPhoto(req.file.buffer, folder);
      await deleteImage(old);
    }
    res.json(await d.save());
  }));

  r.delete('/:id', wrap(async (req, res) => {
    const d = await Model.findByIdAndDelete(req.params.id);
    if (d) await deleteImage(d.image?.publicId);
    res.json({ ok: true });
  }));
  return r;
};
