# Antigravity Agent Guidelines & Workflow Rules

Instruksi dan aturan kerja otomatis untuk AI Agent dalam pengembangan **Frontend Dimsum Intan (Cloud POS Whitelabel)**:

---

## 1. Aturan Wajib Pasca-Pengerjaan Frontend (Post-Task Validation)
Setiap kali selesai mengerjakan atau memodifikasi kode di Frontend (`FE`), Agent **WAJIB** menjalankan langkah validasi berikut:

### A. Validasi TypeScript (`tsc --noEmit`)
```bash
npx tsc --noEmit
# Atau via Docker runner jika node lokal tidak tersedia:
docker run --rm -v "$(pwd)":/app -w /app node:22-alpine npx tsc --noEmit
```
* **Syarat Lolos**: 0 error kompilasi (Exit code `0`). Tidak boleh ada broken types atau props mismatch.

### B. Pengujian Black-Box & White-Box Testing (Mandatory)
Setelah lolos `tsc`, Agent **WAJIB** menjalankan suite pengujian:
```bash
npm test
# Atau via Docker runner:
docker run --rm -v "$(pwd)":/app -w /app node:22-alpine npm test
```
* **White-Box Testing** (`src/__tests__/whitebox/`):
  - Pengujian kalkulasi keranjang & diskon (`cartCalculations.test.ts`), formatting struk belanja (`receiptFormatting.test.ts`), resolusi multi-tenant & subdomain parsing (`apiClient.test.ts`), dan utilitas ekspor data (`exportUtils.test.ts`).
* **Black-Box Testing** (`src/__tests__/blackbox/`):
  - Pengujian alur transaksi POS kasir (`posTransactionFlow.test.ts`), matriks izin hak akses peran Kasir/Supervisor/Owner (`roleAccessMatrix.test.ts`), serta integrasi payment gateway Midtrans BYOK (`paymentGatewayBYOK.test.ts`).
* **Syarat Lolos**: 100% test lulus tanpa kegagalan (0 failures).

---

## 2. Siklus Perbaikan Otomatis (Auto-Fix & Re-Check Loop)
* Jika hasil pengecekan `tsc` maupun test suite menghasilkan error atau kegagalan:
  1. **Dilarang menyerahkan kode error atau melapor selesai sebelum diperbaiki.**
  2. Analisis pesan error dan log kegagalan test secara seksama (file, baris, assertion, dan akar penyebab).
  3. Lakukan perbaikan langsung (*auto-fix*) pada file yang bermasalah.
  4. Jalankan ulang `tsc --noEmit` dan ulangi eksekusi test suite hingga **0 error dan 100% test lulus**.
  5. Laporkan ke user ringkasan perbaikan yang telah dilakukan.
