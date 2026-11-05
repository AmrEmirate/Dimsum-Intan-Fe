import { describe, it, expect, vi } from 'vitest';
import { CLOUDINARY_CONFIG } from '../../services/cloudinaryService';

describe('White Box Testing: Cloudinary Service Configuration & Direct Upload Integration', () => {
  it('should have correct Cloudinary production credentials for Dimsum Intan', () => {
    expect(CLOUDINARY_CONFIG.cloudName).toBe('a61epbay');
    expect(CLOUDINARY_CONFIG.uploadPreset).toBe('dimsum_intan');
    expect(CLOUDINARY_CONFIG.apiUrl).toBe(
      'https://api.cloudinary.com/v1_1/a61epbay/image/upload'
    );
  });

  it('should validate Cloudinary URL format', () => {
    const isCloudinaryUrl = (url: string) => {
      return (
        url.startsWith('https://res.cloudinary.com/a61epbay/') ||
        url.includes('cloudinary.com')
      );
    };

    const validUrl = 'https://res.cloudinary.com/a61epbay/image/upload/v1793872137/dimsum_intan/sample.png';
    const externalUrl = 'https://images.unsplash.com/photo-12345';
    const localUrl = '/uploads/sample.png';

    expect(isCloudinaryUrl(validUrl)).toBe(true);
    expect(isCloudinaryUrl(externalUrl)).toBe(false);
    expect(isCloudinaryUrl(localUrl)).toBe(false);
  });

  it('should validate image file constraints before attempting upload', () => {
    const validateImageFile = (file: { type: string; size: number }, maxSizeMB = 10) => {
      if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'File bukan gambar' };
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: 'Ukuran melebihi batas' };
      }
      return { valid: true };
    };

    expect(validateImageFile({ type: 'image/jpeg', size: 1024 * 1024 })).toEqual({ valid: true });
    expect(validateImageFile({ type: 'image/png', size: 3 * 1024 * 1024 })).toEqual({ valid: true });
    expect(validateImageFile({ type: 'application/pdf', size: 1024 })).toEqual({
      valid: false,
      error: 'File bukan gambar',
    });
    expect(validateImageFile({ type: 'image/png', size: 12 * 1024 * 1024 })).toEqual({
      valid: false,
      error: 'Ukuran melebihi batas',
    });
  });
});
