# Dimsum-Intan-Fe

Frontend Web Application untuk Sistem POS & Akuntansi Sederhana Dimsum Intan (3 Outlet).

## Fitur Utama
- **Dashboard Ringkasan Operasional**: Target penjualan harian vs realisasi, status kas per outlet.
- **Transaksi Kasir (POS)**: Katalog menu, pemilihan kategori, diskon, opsi bayar tunai/QRIS, dan modal struk transaksi.
- **Sesi Shift Kasir**: Form buka shift dengan modal awal, input kas fisik penutupan, serta audit log selisih kas.
- **Master Menu & HPP Dimsum**: Manajemen katalog menu beserta perhitungan margin & harga pokok.
- **Kas Kecil (Petty Cash)**: Formulir pengeluaran darurat outlet dengan upload struk, filter status approval.
- **Tagihan Suplai Pabrik**: Monitor faktur suplai dimsum dan status lunas / jatuh tempo.
- **Beban Operasional Tetap**: Pencatatan beban sewa outlet, listrik, internet, dan gaji.
- **Laporan Laba Rugi & Arus Kas**: Perhitungan otomatis laba kotor & laba bersih.

## Tech Stack
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React & Motion

## Cara Menjalankan
1. Copy `.env.example` ke `.env`
2. Install dependensi:
   ```bash
   npm install
   ```
3. Jalankan server dev:
   ```bash
   npm run dev
   ```
