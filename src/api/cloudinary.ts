import { apiFetch } from './apiFetch';

interface SignResponse {
  timestamp: number;
  signature: string;
  api_key: string;
  cloud_name: string;
  folder: string | null;
}

export async function uploadToCloudinaryFile(file: File): Promise<string> {
  const { timestamp, signature, api_key, cloud_name, folder } =
    await apiFetch<SignResponse>('/api/admin?section=cloudinary-sign');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  if (folder) formData.append('folder', folder);

  // Use /auto/upload so Cloudinary detects resource_type (raw for PDF, image for images)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
    { method: 'POST', body: formData },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    const msg = err?.error?.message ?? `Upload failed (${res.status})`;
    console.error('Cloudinary PDF upload error:', msg, err);
    throw new Error(msg);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const { timestamp, signature, api_key, cloud_name, folder } =
    await apiFetch<SignResponse>('/api/admin?section=cloudinary-sign');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  if (folder) formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? 'Upload failed');
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}
