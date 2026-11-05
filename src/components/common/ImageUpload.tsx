import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  X,
  FileCheck,
} from 'lucide-react';
import { uploadToCloudinary } from '../../services/cloudinaryService';

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Foto Produk / Bukti',
  helperText = 'Format JPG, PNG, atau WebP (maks. 10MB). Otomatis dioptimalkan via Cloudinary.',
  accept = 'image/png,image/jpeg,image/webp,image/jpg',
  maxSizeMB = 10,
  className = '',
  placeholder = 'Pilih foto dari laptop / komputer...',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('File yang dipilih harus berupa file gambar (JPG, PNG, atau WebP).');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`Ukuran file maksimal adalah ${maxSizeMB}MB.`);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const secureUrl = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });
      onChange(secureUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah foto ke Cloudinary.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    onChange('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isCloudinaryUrl = value?.includes('cloudinary.com') || value?.includes('res.cloudinary.com');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & URL Toggle Header */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-bold text-brand-espresso flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            <span>{label}</span>
          </label>
        )}
        <button
          type="button"
          onClick={() => setShowUrlFallback(!showUrlFallback)}
          className="text-[11px] font-semibold text-secondary hover:text-brand-espresso transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlFallback ? 'Tutup Input Tautan' : 'Tautkan URL Eksternal'}</span>
        </button>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Uploading Progress Bar State */}
      {isUploading ? (
        <div className="p-4 rounded-2xl border border-brand-gold/50 bg-brand-gold-subtle/30 flex flex-col items-center justify-center gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-espresso">
            <RefreshCw className="w-4 h-4 text-brand-gold animate-spin" />
            <span>Mengunggah ke Cloudinary... ({uploadProgress}%)</span>
          </div>
          <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-gold h-2 rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-secondary">
            Menyimpan foto resolusi tinggi ke cloud Dimsum Intan
          </span>
        </div>
      ) : value ? (
        /* Image Preview Card State */
        <div className="p-3 rounded-2xl border border-border-strong bg-surface-container flex items-center gap-3 relative group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black/5 shrink-0 border border-border-subtle relative">
            <img
              src={value}
              alt="Pratinjau Foto"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback broken image styling
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isCloudinaryUrl ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Cloudinary CDN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <FileCheck className="w-3 h-3 text-amber-600" />
                    URL Kustom
                  </span>
                )}
                <span className="text-[10px] text-secondary">Foto Siap Dipakai</span>
              </div>
              <p className="text-[11px] font-mono text-secondary truncate mt-1 max-w-[260px] sm:max-w-md">
                {value}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle/60">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-container-high border border-border-subtle text-xs font-bold text-brand-espresso inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Ganti Foto</span>
              </button>
              <button
                type="button"
                onClick={handleClearImage}
                className="px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
            isDragOver
              ? 'border-brand-gold bg-brand-gold-subtle/50 ring-2 ring-brand-gold/30'
              : 'border-border-strong hover:border-brand-gold/60 bg-surface-container/40 hover:bg-surface-container/70'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 text-brand-espresso flex items-center justify-center shadow-2xs">
            <UploadCloud className="w-6 h-6 text-brand-gold" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-brand-espresso">{placeholder}</p>
            <p className="text-[11px] text-secondary mt-0.5">
              Klik untuk memilih dari laptop atau seret foto ke sini
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-[10px] font-bold text-secondary">
            <span>⚡ Terhubung langsung ke Cloudinary (a61epbay)</span>
          </div>
        </div>
      )}

      {/* Optional Manual URL Fallback Input */}
      {showUrlFallback && (
        <div className="pt-2 border-t border-border-subtle/60 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-secondary">Tempel Tautan URL Gambar:</span>
            <button
              type="button"
              onClick={() => setShowUrlFallback(false)}
              className="text-secondary hover:text-brand-espresso p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full p-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs text-brand-espresso placeholder:text-secondary/60 focus:outline-none focus:border-brand-gold"
          />
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !errorMessage && (
        <p className="text-[10px] text-secondary leading-relaxed">{helperText}</p>
      )}
    </div>
  );
};
