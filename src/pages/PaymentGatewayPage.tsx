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
  Wallet,
  Coins,
  Cpu,
  CheckCheck,
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
    latencyMs?: number;
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
    showNotification('Link webhook callback berhasil disalin!', 'info');
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
      showNotification('Konfigurasi payment gateway berhasil disimpan!', 'success');
    } catch (e) {
      // Error handled by context
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle' });
    const startTime = Date.now();
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
          clientKey: midtransClientKey,
          merchantId: midtransMerchantId,
          isProduction: midtransIsProduction,
        };
      }

      const res = await testPaymentGatewayConfig(payload);
      const elapsed = Date.now() - startTime;
      if (res.success) {
        setTestResult({
          status: 'success',
          message: res.message || `Koneksi API ${selectedProvider} berhasil terverifikasi!`,
          latencyMs: elapsed,
        });
        showNotification(`Uji koneksi ${selectedProvider} berhasil (${elapsed} ms)`, 'success');
      } else {
        setTestResult({
          status: 'error',
          message: res.message || 'Kredensial atau otentikasi API Gateway ditolak oleh provider.',
        });
        showNotification('Uji koneksi gateway gagal.', 'error');
      }
    } catch (e: any) {
      setTestResult({
        status: 'error',
        message: e?.message || 'Gagal tersambung ke server Payment Gateway.',
      });
      showNotification('Uji koneksi gateway gagal.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-200 pb-16">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-secondary mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Integrasi Pembayaran Digital
            </span>
            <span className="text-secondary/40">/</span>
            <span className="text-[11px] font-bold text-brand-espresso">Payment Gateway POS</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif-title text-2xl lg:text-3xl font-bold text-brand-espresso tracking-tight">
              Payment Gateway &amp; Integrasi Digital
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isEnabled && selectedProvider !== 'NONE'
                  ? 'bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border'
                  : 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isEnabled && selectedProvider !== 'NONE' ? `Gateway Aktif: ${selectedProvider}` : 'Mode Tunai Saja'}
            </span>
          </div>
          <p className="text-secondary text-sm mt-1">
            Konfigurasi gateway pembayaran otomatis QRIS Dinamis, Virtual Account Bank, dan E-Wallet untuk kasir POS Dimsum Intan.
          </p>
        </div>

        {/* Quick Sync */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadConfig}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-surface-card hover:bg-surface-container-low text-brand-espresso px-4 py-2.5 rounded-xl border border-border-subtle shadow-xs text-xs font-semibold transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-secondary ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* 2. PROVIDER SELECTION CARDS */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">
          Pilih Provider Payment Gateway Utama
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: Duitku */}
          <div
            onClick={() => setSelectedProvider('DUITKU')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
              selectedProvider === 'DUITKU'
                ? 'bg-brand-gold-subtle/40 border-brand-gold shadow-sm ring-2 ring-brand-gold/20'
                : 'bg-surface-card border-border-subtle hover:border-brand-gold/50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold text-brand-espresso flex items-center justify-center font-bold font-mono shadow-xs">
                DK
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-gold text-brand-espresso">
                REKOMENDASI UMKM
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title text-base font-bold text-brand-espresso">Duitku PG</h3>
                {selectedProvider === 'DUITKU' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-secondary mt-1">
                Indonesian Payment Gateway spesialis QRIS Dinamis, Transfer Virtual Account (BCA, Mandiri, BRI, BNI), ShopeePay &amp; OVO.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-[11px] text-secondary">
              <span>Settlement: H+1 Otomatis</span>
              <span className="font-bold text-primary">Biaya MDR 0.7%</span>
            </div>
          </div>

          {/* Option 2: Midtrans */}
          <div
            onClick={() => setSelectedProvider('MIDTRANS')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
              selectedProvider === 'MIDTRANS'
                ? 'bg-brand-gold-subtle/40 border-brand-gold shadow-sm ring-2 ring-brand-gold/20'
                : 'bg-surface-card border-border-subtle hover:border-brand-gold/50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-brand-espresso flex items-center justify-center font-bold font-mono shadow-xs">
                MT
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-secondary">
                POPULER SAAS
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title text-base font-bold text-brand-espresso">Midtrans PG</h3>
                {selectedProvider === 'MIDTRANS' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-secondary mt-1">
                Midtrans Snap payment flow terpadu untuk GoPay, QRIS, Kartu Kredit/Debit, dan ShopeePay.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-[11px] text-secondary">
              <span>Snap Pop-Up Gateway</span>
              <span className="font-bold text-primary">Enterprise Ready</span>
            </div>
          </div>

          {/* Option 3: Offline Only */}
          <div
            onClick={() => setSelectedProvider('NONE')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
              selectedProvider === 'NONE'
                ? 'bg-brand-gold-subtle/40 border-brand-gold shadow-sm ring-2 ring-brand-gold/20'
                : 'bg-surface-card border-border-subtle hover:border-brand-gold/50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-secondary flex items-center justify-center shadow-xs">
                <Coins className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-secondary">
                OFFLINE ONLY
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title text-base font-bold text-brand-espresso">Offline / Tunai Saja</h3>
                {selectedProvider === 'NONE' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-secondary mt-1">
                Bypass seluruh sistem gateway online. Kasir hanya melayani transaksi tunai cash dan transfer manual tanpa auto-settlement.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-[11px] text-secondary">
              <span>Bypass API Cloud</span>
              <span className="font-bold text-secondary">0 Biaya MDR</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN FORM & CONFIGURATION */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-2">
            <div>
              <h2 className="font-serif-title text-lg font-bold text-brand-espresso">
                Konfigurasi Kredensial API ({selectedProvider === 'DUITKU' ? 'Duitku' : selectedProvider === 'MIDTRANS' ? 'Midtrans' : 'Mode Offline'})
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Kunci API (BYOK - Bring Your Own Keys) disimpan terenkripsi di server untuk mengotentikasi pesanan POS.
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-xs font-semibold text-secondary">Status Integrasi:</span>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-brand-gold' : 'bg-surface-container-high'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {selectedProvider === 'NONE' ? (
            <div className="bg-surface-container-low border border-border-subtle rounded-2xl p-6 text-center space-y-2">
              <Coins className="w-10 h-10 text-secondary mx-auto" />
              <h3 className="font-serif-title text-base font-bold text-brand-espresso">Mode Offline Aktif</h3>
              <p className="text-xs text-secondary max-w-md mx-auto">
                Kasir POS Dimsum Intan beroperasi secara manual tanpa integrasi gateway pihak ketiga. Semua transaksi ditutup melalui laci uang tunai atau rekonsiliasi manual.
              </p>
            </div>
          ) : selectedProvider === 'DUITKU' ? (
            /* DUITKU CONFIGURATION FIELDS */
            <div className="space-y-5">
              {/* Environment Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                <div>
                  <span className="text-xs font-bold text-brand-espresso block">Mode Lingkungan (Environment)</span>
                  <span className="text-[11px] text-secondary">
                    {duitkuIsProduction
                      ? 'Production Mode: Transaksi nyata memproses dana perbankan riil.'
                      : 'Sandbox Mode: Simulasi pengujian tanpa memotong saldo bank.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDuitkuIsProduction(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !duitkuIsProduction
                        ? 'bg-brand-gold text-brand-espresso shadow-xs'
                        : 'bg-surface-card text-secondary hover:bg-surface-container'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuitkuIsProduction(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      duitkuIsProduction
                        ? 'bg-status-lunas-text text-white shadow-xs'
                        : 'bg-surface-card text-secondary hover:bg-surface-container'
                    }`}
                  >
                    Production (Live)
                  </button>
                </div>
              </div>

              {/* Merchant Code */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">
                  Duitku Merchant Code <span className="text-brand-terracotta">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={duitkuMerchantCode}
                    onChange={(e) => setDuitkuMerchantCode(e.target.value)}
                    placeholder="Contoh: D1234 atau DSINTAN01"
                    required={isEnabled && selectedProvider === 'DUITKU'}
                    className="w-full bg-surface-canvas border border-border-strong rounded-xl px-4 py-2.5 text-xs font-mono text-brand-espresso focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-xs">
                    <Key className="w-4 h-4 text-secondary/60" />
                  </div>
                </div>
                <p className="text-[11px] text-secondary mt-1">
                  Didapatkan dari dashboard Duitku Merchant pada menu My Account &gt; General Settings.
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">
                  Duitku Merchant API Key <span className="text-brand-terracotta">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showDuitkuKey ? 'text' : 'password'}
                    value={duitkuApiKey}
                    onChange={(e) => setDuitkuApiKey(e.target.value)}
                    placeholder={hasDuitkuKey ? '••••••••••••••••••••••••••••••••' : 'Masukkan API Key Duitku'}
                    required={isEnabled && selectedProvider === 'DUITKU' && !hasDuitkuKey}
                    className="w-full bg-surface-canvas border border-border-strong rounded-xl px-4 py-2.5 pr-20 text-xs font-mono text-brand-espresso focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDuitkuKey(!showDuitkuKey)}
                      className="p-1 text-secondary hover:text-brand-espresso"
                      title={showDuitkuKey ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showDuitkuKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {hasDuitkuKey && (
                      <span className="text-[10px] font-bold text-status-lunas-text bg-status-lunas-bg px-2 py-0.5 rounded-md border border-status-lunas-border">
                        Tersimpan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Webhook Callback URL */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">
                  URL Webhook Callback Duitku (Salin ke Dashboard Duitku)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrls.duitku}
                    className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono text-secondary select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrls.duitku, 'duitku_webhook')}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 bg-surface-card hover:bg-surface-container text-brand-espresso border border-border-subtle rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                  >
                    {copiedKey === 'duitku_webhook' ? (
                      <Check className="w-4 h-4 text-status-lunas-text" />
                    ) : (
                      <Copy className="w-4 h-4 text-secondary" />
                    )}
                    <span>Salin URL</span>
                  </button>
                </div>
                <p className="text-[11px] text-secondary mt-1">
                  Tempel URL ini pada kolom &quot;Callback URL&quot; di dashboard Duitku agar sistem kasir dapat otomatis menerima notifikasi lunas QRIS.
                </p>
              </div>
            </div>
          ) : (
            /* MIDTRANS CONFIGURATION FIELDS */
            <div className="space-y-5">
              {/* Environment Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                <div>
                  <span className="text-xs font-bold text-brand-espresso block">Mode Lingkungan (Environment)</span>
                  <span className="text-[11px] text-secondary">
                    {midtransIsProduction
                      ? 'Production Mode: Transaksi nyata memproses dana perbankan riil.'
                      : 'Sandbox Mode: Simulasi pengujian menggunakan kartu uji coba.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMidtransIsProduction(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !midtransIsProduction
                        ? 'bg-brand-gold text-brand-espresso shadow-xs'
                        : 'bg-surface-card text-secondary hover:bg-surface-container'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setMidtransIsProduction(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      midtransIsProduction
                        ? 'bg-status-lunas-text text-white shadow-xs'
                        : 'bg-surface-card text-secondary hover:bg-surface-container'
                    }`}
                  >
                    Production (Live)
                  </button>
                </div>
              </div>

              {/* Server Key */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">
                  Midtrans Server Key <span className="text-brand-terracotta">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showMidtransKey ? 'text' : 'password'}
                    value={midtransServerKey}
                    onChange={(e) => setMidtransServerKey(e.target.value)}
                    placeholder={hasMidtransKey ? '••••••••••••••••••••••••••••••••' : 'SB-Mid-server-XXXXX'}
                    required={isEnabled && selectedProvider === 'MIDTRANS' && !hasMidtransKey}
                    className="w-full bg-surface-canvas border border-border-strong rounded-xl px-4 py-2.5 pr-20 text-xs font-mono text-brand-espresso focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowMidtransKey(!showMidtransKey)}
                      className="p-1 text-secondary hover:text-brand-espresso"
                      title={showMidtransKey ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showMidtransKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {hasMidtransKey && (
                      <span className="text-[10px] font-bold text-status-lunas-text bg-status-lunas-bg px-2 py-0.5 rounded-md border border-status-lunas-border">
                        Tersimpan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Key */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">Midtrans Client Key</label>
                <input
                  type="text"
                  value={midtransClientKey}
                  onChange={(e) => setMidtransClientKey(e.target.value)}
                  placeholder="SB-Mid-client-XXXXX"
                  className="w-full bg-surface-canvas border border-border-strong rounded-xl px-4 py-2.5 text-xs font-mono text-brand-espresso focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                />
              </div>

              {/* Merchant ID */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">Midtrans Merchant ID</label>
                <input
                  type="text"
                  value={midtransMerchantId}
                  onChange={(e) => setMidtransMerchantId(e.target.value)}
                  placeholder="Contoh: G123456789"
                  className="w-full bg-surface-canvas border border-border-strong rounded-xl px-4 py-2.5 text-xs font-mono text-brand-espresso focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
                />
              </div>

              {/* Webhook Callback URL */}
              <div>
                <label className="text-xs font-bold text-brand-espresso block mb-1.5">
                  URL Notification / Webhook Midtrans
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrls.midtrans}
                    className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono text-secondary select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrls.midtrans, 'midtrans_webhook')}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 bg-surface-card hover:bg-surface-container text-brand-espresso border border-border-subtle rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                  >
                    {copiedKey === 'midtrans_webhook' ? (
                      <Check className="w-4 h-4 text-status-lunas-text" />
                    ) : (
                      <Copy className="w-4 h-4 text-secondary" />
                    )}
                    <span>Salin URL</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. DIAGNOSTICS & TEST CONNECTION PANEL */}
        {selectedProvider !== 'NONE' && (
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-title text-base font-bold text-brand-espresso">
                  Diagnostik &amp; Uji Tes Koneksi API
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Verifikasi apakah server POS Dimsum Intan dapat mengotentikasi dan bertukar sinyal handshake dengan provider {selectedProvider}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] bg-surface-card hover:bg-surface-container-low text-brand-espresso px-5 py-2.5 rounded-xl border border-border-strong shadow-xs text-xs font-bold transition-all active:scale-95 self-start sm:self-auto disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 text-primary ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji API...' : `Uji Koneksi ${selectedProvider}`}</span>
              </button>
            </div>

            {/* Test Result Indicator */}
            {testResult.status !== 'idle' && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                  testResult.status === 'success'
                    ? 'bg-status-lunas-bg text-status-lunas-text border-status-lunas-border'
                    : 'bg-status-unpaid-bg text-status-unpaid-text border-status-unpaid-border'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-status-lunas-text" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-status-unpaid-text" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.status === 'success' ? 'Koneksi Berhasil Terverifikasi' : 'Koneksi Gagal'}
                    {testResult.latencyMs && (
                      <span className="font-mono ml-2 font-normal">({testResult.latencyMs} ms)</span>
                    )}
                  </div>
                  <div className="mt-0.5">{testResult.message}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. ACTIVE PAYMENT METHODS SUMMARY */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs">
          <h3 className="font-serif-title text-base font-bold text-brand-espresso mb-1">
            Ringkasan Metode Pembayaran Kasir POS
          </h3>
          <p className="text-xs text-secondary mb-4">
            Metode pembayaran yang akan muncul pada popup checkout kasir outlet Dimsum Intan.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <QrCode className="w-5 h-5 text-primary" />
                <span className="w-2 h-2 rounded-full bg-status-lunas-text" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-espresso block">QRIS Dinamis</span>
                <span className="text-[10px] text-secondary">Settlement Instan</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="w-2 h-2 rounded-full bg-status-lunas-text" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-espresso block">Virtual Account</span>
                <span className="text-[10px] text-secondary">BCA, Mandiri, BRI, BNI</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="w-2 h-2 rounded-full bg-status-lunas-text" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-espresso block">E-Wallet</span>
                <span className="text-[10px] text-secondary">ShopeePay, OVO, Dana</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="w-2 h-2 rounded-full bg-status-lunas-text" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-espresso block">Tunai Kasir</span>
                <span className="text-[10px] text-secondary">Laci Uang Kasir</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. FORM ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={loadConfig}
            className="inline-flex items-center justify-center min-h-[48px] px-5 bg-surface-card hover:bg-surface-container-low text-secondary hover:text-brand-espresso border border-border-subtle rounded-xl text-xs font-bold transition-all"
          >
            Reset ke Pengaturan Awal
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan Konfigurasi Gateway'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
