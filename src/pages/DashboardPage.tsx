import React, { useState } from 'react';
import {
  TrendingUp,
  Banknote,
  ReceiptText,
  Store,
  ArrowUpRight,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PinAuthorizationModal } from '../components/common/PinAuthorizationModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { Order } from '../types';

export const DashboardPage: React.FC = () => {
  const {
    orders,
    menuItems,
    outlets,
    selectedOutletId,
    setCurrentView,
    activeShift,
    voidOrder,
    factoryInvoices,
    pettyCashList,
    fixedExpenses,
    currentUser,
    showNotification,
  } = useApp();

  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('Kesalahan input meja oleh kasir');

  // Calculations
  const filteredOrders = orders.filter((o) => {
    if (selectedOutletId === 'all') return true;
    return o.outletId === selectedOutletId;
  });

  const totalOmzet = filteredOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrdersCount = filteredOrders.filter((o) => o.status === 'PAID').length;
  const avgTicket = totalOrdersCount > 0 ? Math.round(totalOmzet / totalOrdersCount) : 0;

  const totalHpp = filteredOrders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.hppTotal, 0);

  const grossProfit = totalOmzet - totalHpp;
  const grossMargin = totalOmzet > 0 ? ((grossProfit / totalOmzet) * 100).toFixed(1) : '54.2';

  // Fixed & Factory opex for estimate
  const totalPettyCash = pettyCashList
    .filter((p) => p.status === 'DISETUJUI')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalFixedOpex = fixedExpenses
    .filter((e) => e.status === 'LUNAS')
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = Math.max(0, grossProfit - totalPettyCash);

  const handleTriggerVoid = (order: Order) => {
    if (currentUser.role === 'KASIR') {
      showNotification('Kasir tidak memiliki wewenang membatalkan nota! Membutuhkan otorisasi Supervisor.', 'warning');
    }
    setOrderToVoid(order);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    if (orderToVoid) {
      voidOrder(orderToVoid.id, voidReason, '1234');
      setIsPinModalOpen(false);
      setOrderToVoid(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-secondary mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Konsolidasi Operasional & Keuangan
            </span>
            <span className="text-secondary/40">/</span>
            <span className="text-[11px] font-bold text-brand-espresso">Live Executive Hub</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif-title text-2xl lg:text-3xl font-bold text-brand-espresso tracking-tight">
              Ringkasan Eksekutif Dimsum Intan
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-surface-container text-xs text-secondary font-bold">
              3 Outlet Terhubung
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => showNotification('Data periode: Hari Ini (Konsolidasi Live)', 'info')}
            className="inline-flex items-center gap-1.5 bg-surface-card hover:bg-surface-container-low text-brand-espresso px-3.5 py-2 rounded-xl border border-border-subtle shadow-xs text-xs font-semibold transition-all"
          >
            <Calendar className="w-4 h-4 text-secondary" />
            <span>Hari Ini</span>
          </button>
          <button
            onClick={() => setCurrentView('laporan-laba-rugi-arus-kas')}
            className="inline-flex items-center gap-1.5 bg-surface-card hover:bg-surface-container-low text-brand-espresso px-3.5 py-2 rounded-xl border border-border-subtle shadow-xs text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Ekspor P&L</span>
          </button>
          <button
            onClick={() => setCurrentView('transaksi-kasir-pos')}
            className="inline-flex items-center gap-1.5 bg-brand-gold hover:bg-brand-gold-hover text-brand-espresso px-4 py-2 rounded-xl shadow-xs text-xs font-bold transition-all active:scale-95"
          >
            <Store className="w-4 h-4" />
            <span>Buka Layar Kasir</span>
          </button>
        </div>
      </div>

      {/* 4 Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Omzet */}
        <div className="relative overflow-hidden bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Omzet Hari Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center text-status-lunas-text text-[11px] font-bold bg-status-lunas-bg px-2 py-0.5 rounded-full border border-status-lunas-border">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
            </span>
            <span className="text-[11px] text-secondary">vs rata-rata harian</span>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle flex justify-between items-center text-xs text-secondary">
            <span>Target 3 Cabang: Rp 22 Jt</span>
            <span className="font-bold text-brand-espresso">
              {((totalOmzet / 22000000) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 2: Laba Bersih */}
        <div className="relative overflow-hidden bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Estimasi Laba Kotor
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-emerald-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {grossProfit.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center text-emerald-800 text-[11px] font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Margin {grossMargin}%
            </span>
            <span className="text-[11px] text-secondary">Setelah HPP Pabrik</span>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle flex justify-between items-center text-xs text-secondary">
            <span>HPP Rata-rata</span>
            <span className="font-bold text-brand-espresso">45.8% (Optimal)</span>
          </div>
        </div>

        {/* Card 3: Total Transaksi */}
        <div className="relative overflow-hidden bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Nota Transaksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-brand-gold">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              {totalOrdersCount}
            </span>
            <span className="text-sm font-semibold text-secondary">Pesanan</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-secondary">
            <span>Nilai Rata-rata / Tiket:</span>
            <span className="font-bold text-brand-espresso">
              Rp {avgTicket.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle flex justify-between items-center text-xs text-secondary">
            <span>Peak Hours: 12:30 & 19:15</span>
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>

        {/* Card 4: Pengeluaran Kas Kecil & Tagihan Pabrik */}
        <div className="relative overflow-hidden bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Kas Kecil & Suplai Pabrik
            </span>
            <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-brand-terracotta">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-serif-title text-2xl font-bold text-brand-espresso">
              Rp {totalPettyCash.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-brand-terracotta bg-brand-terracotta/10 px-2 py-0.5 rounded-full">
              {pettyCashList.filter((p) => p.status === 'MENUNGGU_VERIFIKASI').length} Pending Verif
            </span>
            <span className="text-[11px] text-secondary">Nota darurat</span>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle flex justify-between items-center text-xs text-secondary">
            <span>Tagihan Pabrik Belum Bayar:</span>
            <span className="font-bold text-red-600">
              {factoryInvoices.filter((f) => f.status !== 'LUNAS').length} Faktur
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Outlet Comparative Section */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="font-serif-title text-lg font-bold text-brand-espresso">
              Status 3 Cabang Operasional
            </h2>
          </div>
          <span className="text-xs text-secondary">Sinkronisasi Cloud Realtime</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {outlets.map((outlet) => {
            const outletOrders = orders.filter((o) => o.outletId === outlet.id && o.status === 'PAID');
            const outletOmzet = outletOrders.reduce((sum, o) => sum + o.total, 0);
            const progress = Math.min(100, Math.round((outletOmzet / outlet.targetDailySales) * 100));

            return (
              <div
                key={outlet.id}
                className="p-4 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-espresso">{outlet.name}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Buka
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary mt-1">{outlet.address}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-secondary">Omzet Hari Ini</span>
                    <span className="font-bold text-sm text-brand-espresso">
                      Rp {outletOmzet.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-brand-gold h-full rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-secondary mt-1 font-semibold">
                    <span>Target: Rp {(outlet.targetDailySales / 1000000).toFixed(1)} Jt</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Recent Transactions Ledger Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-title text-lg font-bold text-brand-espresso">
              Histori Transaksi Kasir Terkini
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Daftar nota penjualan langsung dari terminal kasir dengan otorisasi pembatalan nota
            </p>
          </div>
          <button
            onClick={() => setCurrentView('transaksi-kasir-pos')}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-brand-gold-hover transition-colors"
          >
            <span>Buka Terminal Kasir</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-secondary">
                <th className="py-3 px-4">No. Faktur / Waktu</th>
                <th className="py-3 px-4">Outlet & Meja</th>
                <th className="py-3 px-4">Item Dimsum</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-secondary">
                    Belum ada transaksi penjualan pada outlet ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 8).map((order) => {
                  const isVoided = order.status === 'VOIDED';
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        isVoided ? 'bg-red-50/40 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-brand-espresso">{order.invoiceNumber}</div>
                        <div className="text-[10px] text-secondary">
                          {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB • Kasir: {order.cashierName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-brand-espresso">{order.outletName}</div>
                        <div className="text-[10px] text-secondary uppercase font-bold">
                          {order.orderType === 'dine-in' ? order.tableNumber || 'Dine-In' : 'Takeaway (Bungkus)'}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate font-medium text-brand-espresso">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-secondary">
                          {order.customerName ? `Pelanggan: ${order.customerName}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-brand-espresso border border-border-subtle">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-brand-espresso">
                        Rp {order.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isVoided ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-unpaid-bg text-status-unpaid-text border border-status-unpaid-border">
                            VOIDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-lunas-bg text-status-lunas-text border border-status-lunas-border">
                            LUNAS
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForReceipt(order)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-bold text-brand-espresso transition-colors"
                          >
                            Nota
                          </button>
                          {!isVoided && (
                            <button
                              onClick={() => handleTriggerVoid(order)}
                              className="px-2 py-1 rounded-lg bg-brand-terracotta/10 hover:bg-brand-terracotta hover:text-white text-[11px] font-bold text-brand-terracotta transition-colors"
                              title="Batalkan Nota (Wajib PIN Supervisor)"
                            >
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        order={selectedOrderForReceipt}
        isOpen={!!selectedOrderForReceipt}
        onClose={() => setSelectedOrderForReceipt(null)}
      />

      {/* Supervisor PIN Authorization Modal for Void */}
      <PinAuthorizationModal
        isOpen={isPinModalOpen}
        title="Otorisasi Pembatalan Nota (Void)"
        description={`Masukkan PIN Supervisor untuk membatalkan nota ${orderToVoid?.invoiceNumber} dan mengembalikan stok barang ke sistem.`}
        onSuccess={handlePinSuccess}
        onClose={() => {
          setIsPinModalOpen(false);
          setOrderToVoid(null);
        }}
      />
    </div>
  );
};
