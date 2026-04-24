export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary env vars missing: VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const publicId = file.name
    .replace(/\.[^/.]+$/, '')           // strip extension
    .replace(/[^a-z0-9]/gi, '_')        // replace spaces/special chars with _
    .replace(/_+/g, '_')                // collapse consecutive underscores
    .toLowerCase()
    .slice(0, 60)
    + '_' + Date.now();                 // ensure uniqueness

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'Upload failed');
  }

  const data = await res.json();
  return data.secure_url as string;
}
