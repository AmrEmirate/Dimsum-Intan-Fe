import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  Calendar,
  Building,
  ArrowRight,
  Shield,
  Percent,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfitLossPage: React.FC = () => {
  const {
    orders,
    pettyCashList,
    fixedExpenses,
    selectedOutletId,
    setSelectedOutletId,
    currentUser,
    switchRole,
    outlets,
    showNotification,
  } = useApp();

  const isOwner = currentUser.role === 'OWNER';
  const [activeTabBranch, setActiveTabBranch] = useState<string>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // If user is not Owner, show security guardrail
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-surface-card rounded-3xl border border-border-subtle shadow-sm animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-brand-espresso text-brand-gold flex items-center justify-center mb-4 shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-serif-title text-2xl font-bold text-brand-espresso">
          Akses Laporan Finansial Terkunci
        </h2>
        <p className="text-xs text-secondary mt-1.5 max-w-md leading-relaxed">
          Berdasarkan Blueprint Sistem Dimsum Intan, modul Laporan Laba Rugi, HPP, dan Arus Kas hanya dapat diakses oleh akun dengan peran <strong>OWNER</strong>.
        </p>
        <button
          onClick={() => switchRole('OWNER')}
          className="mt-6 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold shadow-md transition-all active:scale-95"
        >
          Beralih ke Akun Owner (Hj. Intan Permata)
        </button>
      </div>
    );
  }

  // Filter calculations based on activeTabBranch
  const branchOrders = orders.filter((o) => {
    if (activeTabBranch === 'all') return true;
    return o.outletId === activeTabBranch;
  });

  const totalRevenue = branchOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.total, 0);

  const totalHpp = branchOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.hppTotal, 0);

  const grossProfit = totalRevenue - totalHpp;
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Petty cash expenses
  const branchPettyCash = pettyCashList.filter((p) => {
    if (activeTabBranch === 'all') return true;
    return p.outletId === activeTabBranch;
  });
  const totalPettyCash = branchPettyCash
    .filter((p) => p.status === 'DISETUJUI')
    .reduce((sum, p) => sum + p.amount, 0);

  // Fixed OPEX
  const branchFixed = fixedExpenses.filter((e) => {
    if (activeTabBranch === 'all') return true;
    return e.outletId === activeTabBranch || e.outletId === 'all';
  });

  const totalSewa = branchFixed
    .filter((e) => e.category === 'SEWA_LAPAK' && e.status === 'LUNAS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalGaji = branchFixed
    .filter((e) => e.category === 'PAYROLL_GAJI' && e.status === 'LUNAS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUtilitas = branchFixed
    .filter((e) => ['LISTRIK', 'AIR', 'INTERNET_POS'].includes(e.category) && e.status === 'LUNAS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOpex = totalPettyCash + totalSewa + totalGaji + totalUtilitas;
  const netProfit = grossProfit - totalOpex;
  const netMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const triggerExport = (format: 'PDF' | 'EXCEL') => {
    const branchName =
      activeTabBranch === 'all'
        ? 'Konsolidasi_3_Outlet'
        : activeTabBranch === 'du'
        ? 'Dipatiukur'
        : activeTabBranch === 'riau'
        ? 'Riau'
        : 'Buah_Batu';
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'EXCEL') {
      // Generate CSV formatted for Microsoft Excel
      const csvRows = [
        ['LAPORAN LABA RUGI & ARUS KAS - DIMSUM INTAN'],
        [`Cabang: ${branchName}`, `Tanggal Audit: ${dateStr}`],
        [],
        ['KOMPONEN KEUANGAN', 'NOMINAL (IDR)', 'KETERANGAN'],
        ['1. PENDAPATAN (REVENUE)', '', ''],
        ['Total Omzet Penjualan', totalRevenue, `${branchOrders.filter((o) => o.status === 'PAID').length} Transaksi Terbayar`],
        ['Total HPP Dimsum Terjual', -totalHpp, 'Harga Pokok Produksi Pabrik'],
        ['LABA KOTOR (GROSS PROFIT)', grossProfit, `Gross Margin: ${grossMarginPct}%`],
        [],
        ['2. BEBAN OPERASIONAL (OPEX)', '', ''],
        ['Kas Kecil Darurat (Petty Cash)', -totalPettyCash, 'Es batu, galon, plastik'],
        ['Beban Sewa Lapak', -totalSewa, 'Sewa tempat 3 cabang'],
        ['Payroll Gaji Karyawan', -totalGaji, 'Gaji seluruh tim operasional'],
        ['Utilitas (Listrik, Air, POS)', -totalUtilitas, 'PLN, PDAM, Internet'],
        ['TOTAL BEBAN OPERASIONAL', -totalOpex, 'Seluruh pengeluaran operasional'],
        [],
        ['3. LABA BERSIH (NET PROFIT)', netProfit, `Net Margin: ${netMarginPct}%`],
      ];

      const csvContent =
        '\uFEFF' +
        csvRows
          .map((row) =>
            row
              .map((val) => {
                if (typeof val === 'string') {
                  return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
              })
              .join(',')
          )
          .join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Laba_Rugi_Dimsum_Intan_${branchName}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`File Laporan Excel (${branchName}) berhasil diunduh!`, 'success');
    } else {
      // PDF Printable View
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Laporan Laba Rugi Dimsum Intan - ${branchName}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1E1715; }
                .header { border-bottom: 2px solid #8B2500; padding-bottom: 16px; margin-bottom: 24px; }
                .title { font-size: 24px; font-weight: bold; color: #382622; margin: 0; }
                .subtitle { font-size: 13px; color: #666; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
                th { background-color: #F8F5F2; text-align: left; font-weight: bold; }
                .highlight { background-color: #FFF9E6; font-weight: bold; }
                .net { background-color: #382622; color: #FFF; font-weight: bold; font-size: 15px; }
                .text-right { text-align: right; }
                .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">DIMSUM INTAN • LAPORAN LABA RUGI & ARUS KAS</h1>
                <div class="subtitle">Cabang: ${branchName} | Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Otorisasi: Hj. Intan Permata (Owner)</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Komponen Finansial</th>
                    <th class="text-right">Nominal (Rp)</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Total Omzet Penjualan (Gross Revenue)</strong></td>
                    <td class="text-right">Rp ${totalRevenue.toLocaleString('id-ID')}</td>
                    <td>${branchOrders.filter((o) => o.status === 'PAID').length} Transaksi Terbayar</td>
                  </tr>
                  <tr>
                    <td>Total HPP Dimsum Terjual (Modal Pabrik)</td>
                    <td class="text-right" style="color: #c00;">-Rp ${totalHpp.toLocaleString('id-ID')}</td>
                    <td>Harga Beli Pabrik Rekanan</td>
                  </tr>
                  <tr class="highlight">
                    <td><strong>LABA KOTOR (GROSS PROFIT)</strong></td>
                    <td class="text-right"><strong>Rp ${grossProfit.toLocaleString('id-ID')}</strong></td>
                    <td><strong>Gross Margin: ${grossMarginPct}%</strong></td>
                  </tr>
                  <tr><td colspan="3" style="background:#fafafa; font-weight:bold; font-size:11px;">BEBAN OPERASIONAL (OPEX)</td></tr>
                  <tr>
                    <td>Kas Kecil Darurat (Petty Cash)</td>
                    <td class="text-right" style="color: #c00;">-Rp ${totalPettyCash.toLocaleString('id-ID')}</td>
                    <td>Es batu, galon air, kantong plastik</td>
                  </tr>
                  <tr>
                    <td>Sewa Lapak Cabang</td>
                    <td class="text-right" style="color: #c00;">-Rp ${totalSewa.toLocaleString('id-ID')}</td>
                    <td>Beban sewa lokasi</td>
                  </tr>
                  <tr>
                    <td>Payroll Gaji Karyawan</td>
                    <td class="text-right" style="color: #c00;">-Rp ${totalGaji.toLocaleString('id-ID')}</td>
                    <td>Gaji kasir & operasional</td>
                  </tr>
                  <tr>
                    <td>Utilitas (Listrik, Air, POS)</td>
                    <td class="text-right" style="color: #c00;">-Rp ${totalUtilitas.toLocaleString('id-ID')}</td>
                    <td>PLN, PDAM, Internet POS</td>
                  </tr>
                  <tr class="highlight">
                    <td>Total Beban Operasional</td>
                    <td class="text-right" style="color: #c00;">-Rp ${totalOpex.toLocaleString('id-ID')}</td>
                    <td>Total Pengeluaran Kas</td>
                  </tr>
                  <tr class="net">
                    <td>LABA BERSIH (NET PROFIT)</td>
                    <td class="text-right">Rp ${netProfit.toLocaleString('id-ID')}</td>
                    <td>Net Margin: ${netMarginPct}%</td>
                  </tr>
                </tbody>
              </table>
              <div class="footer">
                Dokumen resmi sistem akuntansi Dimsum Intan • Terintegrasi PostgreSQL Cloud
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
      showNotification(`Laporan PDF siap dicetak / disimpan!`, 'success');
    }
  };


  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header Controls & Period Navigation */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-espresso text-brand-gold text-[10px] font-black uppercase tracking-wider">
              Finansial Konsolidasi
            </span>
            <span className="text-xs text-secondary flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Audit Terkunci: 31 Okt 2024
            </span>
          </div>
          <h1 className="font-serif-title text-2xl font-bold text-brand-espresso mt-1">
            Pembukuan & Laba Rugi Eksekutif
          </h1>
          <p className="text-xs text-secondary">
            Dimsum Intan Group (Konsolidasi Cabang Dipatiukur, Riau, & Buah Batu)
          </p>
        </div>

        {/* Outlet Switcher & Export CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-surface-card rounded-xl p-1 border border-border-subtle shadow-xs">
            <button
              onClick={() => setActiveTabBranch('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabBranch === 'all'
                  ? 'bg-brand-espresso text-brand-gold shadow-xs'
                  : 'text-secondary hover:text-brand-espresso'
              }`}
            >
              Semua Outlet (3)
            </button>
            <button
              onClick={() => setActiveTabBranch('du')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabBranch === 'du'
                  ? 'bg-brand-espresso text-brand-gold shadow-xs'
                  : 'text-secondary hover:text-brand-espresso'
              }`}
            >
              Dipatiukur
            </button>
            <button
              onClick={() => setActiveTabBranch('riau')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabBranch === 'riau'
                  ? 'bg-brand-espresso text-brand-gold shadow-xs'
                  : 'text-secondary hover:text-brand-espresso'
              }`}
            >
              Riau
            </button>
            <button
              onClick={() => setActiveTabBranch('batu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTabBranch === 'batu'
                  ? 'bg-brand-espresso text-brand-gold shadow-xs'
                  : 'text-secondary hover:text-brand-espresso'
              }`}
            >
              Buah Batu
            </button>
          </div>

          <button
            onClick={() => triggerExport('PDF')}
            className="flex items-center gap-1.5 bg-surface-card hover:bg-surface-container text-brand-espresso text-xs font-bold px-3.5 py-2 rounded-xl border border-border-subtle shadow-xs transition-all active:scale-95"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={() => triggerExport('EXCEL')}
            className="flex items-center gap-1.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
            <span>Ekspor XLSX</span>
          </button>
        </div>
      </div>

      {/* Export notification toast preview */}
      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>
            Berkas Laporan Laba Rugi Dimsum Intan ({exportNotice}) berhasil diproses untuk 3 cabang.
          </span>
          <span className="font-bold underline cursor-pointer">Download File</span>
        </div>
      )}

      {/* 3 Executive High-Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Omzet */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            1. Total Omzet Penjualan (Gross Revenue)
          </span>
          <div className="font-serif-title text-2xl font-bold text-brand-espresso mt-2">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-secondary mt-1 block">
            {branchOrders.filter((o) => o.status === 'PAID').length} Transaksi Terbayar
          </span>
        </div>

        {/* Laba Kotor */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            2. Laba Kotor (Gross Profit)
          </span>
          <div className="font-serif-title text-2xl font-bold text-emerald-700 mt-2">
            Rp {grossProfit.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Gross Margin: {grossMarginPct}%</span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="p-5 rounded-2xl bg-brand-espresso text-white shadow-md border border-brand-espresso-muted/30">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
            3. Laba Bersih (Net Profit)
          </span>
          <div className="font-serif-title text-2xl font-bold text-white mt-2">
            Rp {netProfit.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-white/80 font-medium mt-1">
            Net Margin: <strong className="text-brand-gold">{netMarginPct}%</strong> (Setelah HPP & Seluruh OPEX)
          </div>
        </div>
      </div>

      {/* Formal Financial Statement Ledger Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-serif-title text-base font-bold text-brand-espresso">
              Laporan Laba Rugi Komprehensif (P&L Ledger)
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Standar Akuntansi F&B Indonesia • Dihitung otomatis secara dinamis
            </p>
          </div>
          <span className="text-xs font-bold text-brand-espresso bg-surface-container px-3 py-1 rounded-xl">
            Tahun Buku: 2024
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-border-strong text-secondary text-[11px] font-bold uppercase">
                <th className="py-2.5 px-3">Uraian Akun Finansial</th>
                <th className="py-2.5 px-3 text-right">Rincian Pos (Rp)</th>
                <th className="py-2.5 px-3 text-right">Subtotal / Total (Rp)</th>
                <th className="py-2.5 px-3 text-right">% dari Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {/* 1. Pendapatan */}
              <tr className="bg-surface-container-low font-bold text-brand-espresso">
                <td className="py-3 px-3">1. PENDAPATAN OPERASIONAL (REVENUE)</td>
                <td></td>
                <td className="py-3 px-3 text-right tabular-nums">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </td>
                <td className="py-3 px-3 text-right font-bold">100.0%</td>
              </tr>
              <tr className="text-secondary">
                <td className="py-2 px-6">Penjualan POS Dine-In & Takeaway (3 Cabang)</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </td>
                <td></td>
                <td className="py-2 px-3 text-right">100.0%</td>
              </tr>

              {/* 2. HPP */}
              <tr className="bg-surface-container-low font-bold text-brand-espresso">
                <td className="py-3 px-3">2. HARGA POKOK PENJUALAN (HPP PABRIK)</td>
                <td></td>
                <td className="py-3 px-3 text-right tabular-nums text-red-600">
                  (Rp {totalHpp.toLocaleString('id-ID')})
                </td>
                <td className="py-3 px-3 text-right font-bold text-red-600">
                  {totalRevenue > 0 ? ((totalHpp / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              <tr className="text-secondary">
                <td className="py-2 px-6">Bahan Baku Dimsum Beku & Saus Mentai (PT Dimsum Prima Rasa)</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  Rp {totalHpp.toLocaleString('id-ID')}
                </td>
                <td></td>
                <td className="py-2 px-3 text-right">
                  {totalRevenue > 0 ? ((totalHpp / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>

              {/* 3. LABA KOTOR */}
              <tr className="bg-emerald-50/70 font-bold text-emerald-900 border-y-2 border-emerald-200">
                <td className="py-3 px-3 text-sm">3. LABA KOTOR (GROSS PROFIT)</td>
                <td></td>
                <td className="py-3 px-3 text-right text-sm tabular-nums">
                  Rp {grossProfit.toLocaleString('id-ID')}
                </td>
                <td className="py-3 px-3 text-right text-sm">{grossMarginPct}%</td>
              </tr>

              {/* 4. BEBAN OPERASIONAL */}
              <tr className="bg-surface-container-low font-bold text-brand-espresso">
                <td className="py-3 px-3">4. BEBAN OPERASIONAL TETAP & DARURAT (OPEX)</td>
                <td></td>
                <td className="py-3 px-3 text-right tabular-nums text-red-600">
                  (Rp {totalOpex.toLocaleString('id-ID')})
                </td>
                <td className="py-3 px-3 text-right font-bold text-red-600">
                  {totalRevenue > 0 ? ((totalOpex / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              <tr className="text-secondary">
                <td className="py-2 px-6">• Kas Kecil Darurat Laci (Petty Cash Outlet)</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  Rp {totalPettyCash.toLocaleString('id-ID')}
                </td>
                <td></td>
                <td className="py-2 px-3 text-right">
                  {totalRevenue > 0 ? ((totalPettyCash / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              <tr className="text-secondary">
                <td className="py-2 px-6">• Sewa Lapak Cabang (Dipatiukur, Riau, Buah Batu)</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  Rp {totalSewa.toLocaleString('id-ID')}
                </td>
                <td></td>
                <td className="py-2 px-3 text-right">
                  {totalRevenue > 0 ? ((totalSewa / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              <tr className="text-secondary">
                <td className="py-2 px-6">• Payroll Gaji Karyawan Kasir & Dapur (12 Orang)</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  Rp {totalGaji.toLocaleString('id-ID')}
                </td>
                <td></td>
                <td className="py-2 px-3 text-right">
                  {totalRevenue > 0 ? ((totalGaji / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              <tr className="text-secondary">
                <td className="py-2 px-6">• Utilitas Listrik PLN Steamer, Air, & Cloud POS</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  Rp {totalUtilitas.toLocaleString('id-ID')}
                </td>
                <td></td>
                <td className="py-2 px-3 text-right">
                  {totalRevenue > 0 ? ((totalUtilitas / totalRevenue) * 100).toFixed(1) : '0'}%
                </td>
              </tr>

              {/* 5. LABA BERSIH */}
              <tr className="bg-brand-espresso text-brand-gold font-bold text-sm border-t-2 border-brand-gold">
                <td className="py-4 px-3 font-serif-title text-base tracking-wide">
                  5. LABA BERSIH SEBELUM PAJAK (NET OPERATING PROFIT)
                </td>
                <td></td>
                <td className="py-4 px-3 text-right tabular-nums font-serif-title text-lg">
                  Rp {netProfit.toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-3 text-right font-serif-title text-base">{netMarginPct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
