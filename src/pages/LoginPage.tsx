import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Shield,
  ChefHat,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, outlets, currentTenant } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const brandName = currentTenant?.name || 'DIMSUM INTAN';
  const brandSlug = currentTenant?.slug ? `${currentTenant.slug}.posmu.cloud` : 'Cloud POS & Accounting';
  const brandColor = currentTenant?.themeColor || '#ea580c';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan username dan password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const success = await login(username, password);
    setIsLoading(false);
    if (!success) {
      setErrorMessage('Username atau password yang Anda masukkan salah.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1E1715] via-[#2A1F1C] to-[#16100E] p-4 sm:p-6 antialiased relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-terracotta/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md lg:max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-surface-card/95 backdrop-blur-xl z-10">
        {/* Left Side: Brand Heritage Banner (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-espresso via-[#382622] to-brand-espresso p-8 flex-col justify-between text-white relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif font-black text-xl shadow-lg text-white"
                style={{ backgroundColor: brandColor }}
              >
                {currentTenant?.logoUrl ? (
                  <img src={currentTenant.logoUrl} alt={brandName} className="w-full h-full object-contain p-1" />
                ) : (
                  brandName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-serif-title font-bold text-lg leading-tight text-white truncate">
                  {brandName}
                </h1>
                <p className="text-[10px] tracking-wider uppercase font-semibold text-brand-gold truncate">
                  {brandSlug}
                </p>
              </div>
            </div>

            <div className="space-y-3 my-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sistem Kasir POS & Akuntansi</span>
              </div>
              <h2 className="font-serif-title text-2xl font-bold leading-snug text-white">
                Pengelolaan Operasional Terintegrasi Cloud
              </h2>
              <p className="text-xs text-white/70 leading-relaxed">
                {outlets.length > 0
                  ? `Kelola operasional dan penjualan ${outlets.length} cabang (${outlets.map((o) => o.name).join(', ')}), pantau modal laci shift, rekonsiliasi kas kecil, dan laba rugi dalam satu pintu aman.`
                  : 'Kelola penjualan operasional seluruh cabang, pantau modal laci shift kasir, rekonsiliasi kas kecil darurat, dan analisis laba rugi secara terpusat.'}
              </p>
            </div>
          </div>

          {/* Quick Outlet Badges */}
          <div className="pt-6 border-t border-white/15 relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 block mb-2">
              Jaringan Cabang Aktif:
            </span>
            {outlets.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {outlets.map((o) => (
                  <span key={o.id} className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-medium">
                    {o.code ? `${o.code} ` : ''}{o.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-white/50 italic">
                Belum ada cabang terdaftar. Masuk dengan akun Owner untuk mendaftarkan cabang baru.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-surface-card">
          <div>
            {/* Mobile Brand Header */}
            <div className="flex lg:hidden flex-col items-center text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl p-2 flex items-center justify-center shadow-lg border border-brand-gold/30 mb-2.5 font-serif font-black text-2xl text-white"
                style={{ backgroundColor: brandColor }}
              >
                {currentTenant?.logoUrl ? (
                  <img src={currentTenant.logoUrl} alt={brandName} className="w-full h-full object-contain filter drop-shadow" />
                ) : (
                  brandName.charAt(0).toUpperCase()
                )}
              </div>
              <h1 className="font-serif-title font-bold text-xl text-brand-espresso tracking-tight">
                {brandName}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-0.5">
                {brandSlug}
              </span>
            </div>

            <div className="mb-6 text-center lg:text-left">
              <h2 className="font-serif-title text-2xl font-bold text-brand-espresso">
                Selamat Datang Kembali
              </h2>
              <p className="text-xs text-secondary mt-1">
                Silakan masuk dengan akun resmi {brandName}
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-espresso mb-1.5">
                  Username Akun
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: owner, supervisor, kasir"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-medium text-brand-espresso placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-espresso mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container border border-border-subtle text-xs font-medium text-brand-espresso placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-brand-espresso"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-hover active:scale-[0.99] text-brand-espresso text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Memproses Autentikasi...</span>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Notice Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border-subtle flex items-center justify-center gap-1.5 text-secondary text-[10px] sm:text-xs text-center">
            <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{brandName} Cloud POS & Enterprise Accounting • Multi-Tenant Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
