import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `school/${folder}`, resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
        (err, r) => (err ? reject(err) : resolve({ url: r.secure_url, publicId: r.public_id }))
      )
      .end(buffer);
  });

export const deleteImage = async (publicId) => {
  if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
};

// Any file (PDF or image), e.g. exam papers
export const uploadFile = (buffer, folder, fileName) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `school/${folder}`, resource_type: 'auto', use_filename: true, filename_override: fileName }, (err, r) =>
        err ? reject(err) : resolve({ url: r.secure_url, publicId: r.public_id, resourceType: r.resource_type, fileName })
      )
      .end(buffer);
  });

export const deleteFile = async (f) => {
  if (f?.publicId) await cloudinary.uploader.destroy(f.publicId, { resource_type: f.resourceType || 'image' }).catch(() => {});
};

// School logo: keep the aspect ratio (no square crop)
export const uploadLogo = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'school/branding', resource_type: 'image', transformation: [{ width: 256, height: 256, crop: 'limit' }] }, (err, r) =>
        err ? reject(err) : resolve({ url: r.secure_url, publicId: r.public_id })
      )
      .end(buffer);
  });

// Website images (hero, gallery, news): keep aspect ratio, cap the width
export const uploadPhoto = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `school/${folder}`, resource_type: 'image', transformation: [{ width: 1600, crop: 'limit' }, { quality: 'auto' }] }, (err, r) =>
        err ? reject(err) : resolve({ url: r.secure_url, publicId: r.public_id })
      )
      .end(buffer);
  });
