/**
 * Cloudinary Upload Service for Dimsum Intan
 * Direct browser-to-cloud secure upload using preset 'dimsum_intan'
 * Cloud Name: a61epbay
 */

export const CLOUDINARY_CONFIG = {
  cloudName: 'a61epbay',
  uploadPreset: 'dimsum_intan',
  apiUrl: 'https://api.cloudinary.com/v1_1/a61epbay/image/upload',
};

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
}

/**
 * Upload an image file from laptop/device directly to Cloudinary
 * Tracks progress via XMLHttpRequest upload progress events
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_CONFIG.apiUrl);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error('Cloudinary tidak mengembalikan URL foto yang valid.'));
          }
        } catch {
          reject(new Error('Gagal mengurai respon dari server Cloudinary.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || `Cloudinary upload gagal (Kode ${xhr.status})`));
        } catch {
          reject(new Error(`Gagal mengunggah foto ke Cloudinary (Status ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Koneksi terputus saat mengunggah foto ke Cloudinary. Periksa jaringan Anda.'));
    };

    xhr.send(formData);
  });
}
