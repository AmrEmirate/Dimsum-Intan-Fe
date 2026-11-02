import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Key,
  Lock,
  Globe,
  Radio,
  Eye,
  EyeOff,
  Zap,
  HelpCircle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PaymentGatewayPage: React.FC = () => {
  const {
    getPaymentGatewayConfig,
    updatePaymentGatewayConfig,
    testPaymentGatewayConfig,
    showNotification,
  } = useApp();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [selectedProvider, setSelectedProvider] = useState<'DUITKU' | 'MIDTRANS' | 'NONE'>('DUITKU');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Duitku State
  const [duitkuMerchantCode, setDuitkuMerchantCode] = useState<string>('');
  const [duitkuApiKey, setDuitkuApiKey] = useState<string>('');
  const [duitkuIsProduction, setDuitkuIsProduction] = useState<boolean>(false);
  const [showDuitkuKey, setShowDuitkuKey] = useState<boolean>(false);
  const [hasDuitkuKey, setHasDuitkuKey] = useState<boolean>(false);

  // Midtrans State
  const [midtransServerKey, setMidtransServerKey] = useState<string>('');
  const [midtransClientKey, setMidtransClientKey] = useState<string>('');
  const [midtransMerchantId, setMidtransMerchantId] = useState<string>('');
  const [midtransIsProduction, setMidtransIsProduction] = useState<boolean>(false);
  const [showMidtransKey, setShowMidtransKey] = useState<boolean>(false);
  const [hasMidtransKey, setHasMidtransKey] = useState<boolean>(false);

  // Webhook URLs
  const [webhookUrls, setWebhookUrls] = useState<{ duitku: string; midtrans: string }>({
    duitku: 'https://api.posmu.cloud/api/v1/payment/duitku/callback',
    midtrans: 'https://api.posmu.cloud/api/v1/billing/webhook/midtrans',
  });

  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Load Config
  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const res = await getPaymentGatewayConfig();
      if (res) {
        setSelectedProvider((res.provider as any) || 'NONE');
        setIsEnabled(res.enabled !== false);

        if (res.duitku) {
          setDuitkuMerchantCode(res.duitku.merchantCode || '');
          setDuitkuApiKey(res.duitku.apiKeyMasked || '');
          setDuitkuIsProduction(Boolean(res.duitku.isProduction));
          setHasDuitkuKey(Boolean(res.duitku.hasApiKey));
        }

        if (res.midtrans) {
          setMidtransServerKey(res.midtrans.serverKeyMasked || '');
          setMidtransClientKey(res.midtrans.clientKey || '');
          setMidtransMerchantId(res.midtrans.merchantId || '');
          setMidtransIsProduction(Boolean(res.midtrans.isProduction));
          setHasMidtransKey(Boolean(res.midtrans.hasServerKey));
        }

        if (res.webhookUrls) {
          setWebhookUrls(res.webhookUrls);
        }
      }
    } catch (e) {
      // Error handled by context
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showNotification('Link webhook berhasil disalin ke clipboard!', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePaymentGatewayConfig({
        provider: selectedProvider,
        enabled: isEnabled,
        duitkuMerchantCode,
        duitkuApiKey,
        duitkuIsProduction,
        midtransServerKey,
        midtransClientKey,
        midtransMerchantId,
        midtransIsProduction,
      });
      await loadConfig();
    } catch (e) {
      // Error handled by context
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle' });
    try {
      const payload: any = {
        provider: selectedProvider,
      };

      if (selectedProvider === 'DUITKU') {
        payload.credentials = {
          merchantCode: duitkuMerchantCode,
          apiKey: duitkuApiKey,
          isProduction: duitkuIsProduction,
        };
      } else if (selectedProvider === 'MIDTRANS') {
        payload.credentials = {
          serverKey: midtransServerKey,
          isProduction: midtransIsProduction,
        };
      }

      const res = await testPaymentGatewayConfig(payload);
      if (res.success) {
        setTestResult({ status: 'success', message: res.message });
        showNotification(res.message || 'Koneksi ke gateway berhasil!', 'success');
      } else {
        setTestResult({ status: 'error', message: res.message });
        showNotification(res.message || 'Koneksi ke gateway ditolak.', 'error');
      }
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Gagal menghubungi server gateway' });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-gray-400 font-medium text-sm">Memuat pengaturan Payment Gateway...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Mandiri (Bring Your Own Keys)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Pengaturan Payment Gateway
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
              Hubungkan akun <strong className="text-gray-200">Midtrans</strong> atau{' '}
              <strong className="text-gray-200">Duitku</strong> milik Anda sendiri. Uang hasil scan QRIS kasir akan{' '}
              <span className="text-emerald-400 font-medium">100% langsung cair ke rekening bank Anda</span> tanpa
              melalui penampungan platform dan tanpa antrean penarikan dana manual.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadConfig}
              className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition border border-gray-700/50 shadow-sm"
              title="Refresh status"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Ringkas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-850/80 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Provider Kasir Aktif</span>
            <Radio className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {selectedProvider === 'DUITKU' && <span className="text-blue-400">Duitku Payment Gateway</span>}
            {selectedProvider === 'MIDTRANS' && <span className="text-emerald-400">Midtrans Snap & QRIS</span>}
            {selectedProvider === 'NONE' && <span className="text-gray-400">Mode Simulator / Uji Coba</span>}
          </div>
          <p className="text-xs text-gray-400">
            {selectedProvider === 'NONE'
              ? 'Kasir menggunakan QRIS simulasi offline'
              : 'Aktif otomatis pada setiap transaksi kasir POS'}
          </p>
        </div>

        <div className="bg-gray-850/80 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Alur Pencairan (Settlement)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400">Langsung ke Rekening Anda</div>
          <p className="text-xs text-gray-400">Sesuai jadwal settlement akun gateway Anda (H+0 / H+1)</p>
        </div>

        <div className="bg-gray-850/80 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Mode Keamanan API</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">SHA-512 & MD5 Webhook</div>
          <p className="text-xs text-gray-400">Validasi signature ketat untuk mencegah manipulasi nota</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Step 1: Pilih Provider */}
        <div className="bg-gray-850 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              1. Pilih Provider Payment Gateway
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Tentukan provider yang ingin digunakan untuk transaksi kasir di toko Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Duitku Card */}
            <div
              onClick={() => setSelectedProvider('DUITKU')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                selectedProvider === 'DUITKU'
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                  : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
              }`}
            >
              {selectedProvider === 'DUITKU' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-base mb-3 border border-blue-500/20">
                DK
              </div>
              <h3 className="font-bold text-white text-base">Duitku</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Rekomendasi terbaik untuk QRIS Dinamis instan, VA BCA/Mandiri/BRI/BNI, dan e-wallet lokal.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                <span>Rekomendasi POS F&B</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Midtrans Card */}
            <div
              onClick={() => setSelectedProvider('MIDTRANS')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                selectedProvider === 'MIDTRANS'
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                  : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
              }`}
            >
              {selectedProvider === 'MIDTRANS' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base mb-3 border border-emerald-500/20">
                MT
              </div>
              <h3 className="font-bold text-white text-base">Midtrans</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Mendukung GoPay, QRIS, Kartu Kredit, Virtual Account, dan ekosistem pembayaran GoTo.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>GoPay & Kartu Kredit</span>
              </div>
            </div>

            {/* Simulator Card */}
            <div
              onClick={() => setSelectedProvider('NONE')}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                selectedProvider === 'NONE'
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                  : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
              }`}
            >
              {selectedProvider === 'NONE' && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="w-10 h-10 rounded-xl bg-gray-800 text-gray-300 flex items-center justify-center font-bold text-base mb-3 border border-gray-700">
                SM
              </div>
              <h3 className="font-bold text-white text-base">Mode Simulator</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Gunakan mode uji coba lokal tanpa akun gateway. Berguna untuk demonstrasi dan pelatihan kasir baru.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span>Uji Coba Offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Form Kredensial sesuai Provider Terpilih */}
        {selectedProvider === 'DUITKU' && (
          <div className="bg-gray-850 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  2. Kredensial Akun Duitku Anda
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Ambil Merchant Code dan API Key dari dashboard resmi Duitku (passport.duitku.com).
                </p>
              </div>

              {/* Mode Sandbox vs Production Toggle */}
              <div className="flex items-center gap-3 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDuitkuIsProduction(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    !duitkuIsProduction
                      ? 'bg-amber-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sandbox (Uji Coba)
                </button>
                <button
                  type="button"
                  onClick={() => setDuitkuIsProduction(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    duitkuIsProduction
                      ? 'bg-emerald-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Live (Production)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Merchant Code */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Duitku Merchant Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={duitkuMerchantCode}
                  onChange={(e) => setDuitkuMerchantCode(e.target.value)}
                  placeholder="Contoh: D12345"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500">Kode merchant unik dari Duitku.</p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Duitku API Key <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showDuitkuKey ? 'text' : 'password'}
                    value={duitkuApiKey}
                    onChange={(e) => setDuitkuApiKey(e.target.value)}
                    placeholder={hasDuitkuKey ? '•••••••• (Tersimpan aman)' : 'Masukkan API Key Duitku'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono text-sm"
                    required={!hasDuitkuKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDuitkuKey(!showDuitkuKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showDuitkuKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {hasDuitkuKey
                    ? 'Kunci telah tersimpan. Kosongkan/biarkan bertanda titik jika tidak ingin mengubah.'
                    : 'Kunci rahasia API dari menu Integrasi di portal Duitku.'}
                </p>
              </div>
            </div>

            {/* Webhook Callback Box */}
            <div className="bg-gray-900/80 border border-blue-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  Duitku Callback URL (Wajib Didaftarkan)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrls.duitku, 'duitku-url')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold border border-blue-500/30 transition"
                >
                  {copiedKey === 'duitku-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'duitku-url' ? 'Tersalin' : 'Salin URL'}
                </button>
              </div>
              <div className="font-mono text-xs bg-black/40 px-3.5 py-2.5 rounded-xl text-gray-300 break-all select-all border border-gray-800">
                {webhookUrls.duitku}
              </div>
              <p className="text-xs text-gray-400">
                Masukkan URL ini ke kolom <strong>Callback URL</strong> di menu <em>Proyek & Integrasi &gt; Pengaturan URL</em> pada dashboard Duitku Anda.
              </p>
            </div>
          </div>
        )}

        {selectedProvider === 'MIDTRANS' && (
          <div className="bg-gray-850 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  2. Kredensial Akun Midtrans Anda
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Ambil Access Keys dari dashboard resmi Midtrans (dashboard.midtrans.com).
                </p>
              </div>

              {/* Mode Sandbox vs Production Toggle */}
              <div className="flex items-center gap-3 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMidtransIsProduction(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    !midtransIsProduction
                      ? 'bg-amber-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sandbox (Uji Coba)
                </button>
                <button
                  type="button"
                  onClick={() => setMidtransIsProduction(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    midtransIsProduction
                      ? 'bg-emerald-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Live (Production)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server Key */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Midtrans Server Key <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showMidtransKey ? 'text' : 'password'}
                    value={midtransServerKey}
                    onChange={(e) => setMidtransServerKey(e.target.value)}
                    placeholder={hasMidtransKey ? '•••••••• (Tersimpan aman)' : 'Contoh: Mid-server-xxxx'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono text-sm"
                    required={!hasMidtransKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMidtransKey(!showMidtransKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showMidtransKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Kunci rahasia server untuk request transaksi kasir.</p>
              </div>

              {/* Client Key */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Midtrans Client Key
                </label>
                <input
                  type="text"
                  value={midtransClientKey}
                  onChange={(e) => setMidtransClientKey(e.target.value)}
                  placeholder="Contoh: Mid-client-xxxx"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Client Key publik dari dashboard Midtrans.</p>
              </div>
            </div>

            {/* Webhook Callback Box */}
            <div className="bg-gray-900/80 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  Midtrans Notification URL (Wajib Didaftarkan)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrls.midtrans, 'midtrans-url')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/30 transition"
                >
                  {copiedKey === 'midtrans-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'midtrans-url' ? 'Tersalin' : 'Salin URL'}
                </button>
              </div>
              <div className="font-mono text-xs bg-black/40 px-3.5 py-2.5 rounded-xl text-gray-300 break-all select-all border border-gray-800">
                {webhookUrls.midtrans}
              </div>
              <p className="text-xs text-gray-400">
                Masukkan URL ini ke kolom <strong>Payment Notification URL</strong> di menu <em>Settings &gt; Configuration</em> pada dashboard Midtrans Anda.
              </p>
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult.status !== 'idle' && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 animate-fadeIn ${
              testResult.status === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            {testResult.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-bold">
                {testResult.status === 'success' ? 'Verifikasi Sukses' : 'Gagal Verifikasi'}
              </p>
              <p className="text-xs opacity-90 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-800">
          {selectedProvider !== 'NONE' && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-bold text-sm border border-gray-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
              <span>Uji Koneksi (Test API Keys)</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving || isTesting}
            className="w-full sm:w-auto px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Simpan Pengaturan Gateway</span>
          </button>
        </div>
      </form>

      {/* Panduan 3 Langkah Pendaftaran */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-400" />
          Panduan Singkat: Cara Membuat Akun Payment Gateway Toko Anda
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-gray-850 p-4 rounded-2xl border border-gray-800/80 space-y-2">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/30">
              1
            </div>
            <h4 className="font-bold text-sm text-white">Daftar Akun Merchant</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Daftar gratis di{' '}
              <a
                href="https://duitku.com"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:underline inline-flex items-center gap-0.5"
              >
                Duitku.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              atau{' '}
              <a
                href="https://midtrans.com"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:underline inline-flex items-center gap-0.5"
              >
                Midtrans.com <ExternalLink className="w-3 h-3" />
              </a>
              . Lengkapi verifikasi KTP/rekening bank toko Anda.
            </p>
          </div>

          <div className="bg-gray-850 p-4 rounded-2xl border border-gray-800/80 space-y-2">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/30">
              2
            </div>
            <h4 className="font-bold text-sm text-white">Salin Kredensial & Webhook</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Buka menu Integrasi / API Keys di dashboard gateway. Salin Merchant Code & API Key ke formulir di atas, lalu daftarkan Webhook URL kita.
            </p>
          </div>

          <div className="bg-gray-850 p-4 rounded-2xl border border-gray-800/80 space-y-2">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/30">
              3
            </div>
            <h4 className="font-bold text-sm text-white">Siap Dipakai Kasir</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Begitu disimpan, saat kasir klik bayar QRIS, QR dinamis akan terhubung ke rekening gateway Anda. Uang langsung masuk tanpa perantara!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
