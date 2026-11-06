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

### B. Pengujian Black-Box & White-Box Testing (Targeted / Khusus Fitur yang Diubah - Mandatory)
Setelah lolos `tsc`, Agent **WAJIB** menjalankan pengujian Black-box dan White-box yang difokuskan secara spesifik (**targeted**) **hanya pada fitur, modul, atau file yang diubah/diperbaiki** agar cepat dan efisien:
```bash
npm test -- <path_file_test_terkait>
# Atau via Docker runner:
docker run --rm -v "$(pwd)":/app -w /app node:22-alpine npm test -- <path_file_test_terkait>
```
* **White-Box Testing** (`src/__tests__/whitebox/`):
  - Pengujian logika keranjang, format struk, parsing tenant, atau API client pada modul yang dimodifikasi.
* **Black-Box Testing** (`src/__tests__/blackbox/`):
  - Pengujian alur transaksi POS kasir, matriks izin peran, atau integrasi payment gateway pada fitur yang diubah.
* **Syarat Lolos**: 100% test pada fitur yang diubah lulus tanpa kegagalan (0 failures).

---

## 2. Siklus Perbaikan Otomatis (Auto-Fix & Re-Check Loop)
* Jika hasil pengecekan `tsc` maupun test suite menghasilkan error atau kegagalan:
  1. **Dilarang menyerahkan kode error atau melapor selesai sebelum diperbaiki.**
  2. Analisis pesan error dan log kegagalan test secara seksama (file, baris, assertion, dan akar penyebab).
  3. Lakukan perbaikan langsung (*auto-fix*) pada file yang bermasalah.
  4. Jalankan ulang `tsc --noEmit` dan ulangi eksekusi test targeted pada fitur tersebut hingga **0 error dan 100% test lulus**.
  5. Laporkan ke user ringkasan perbaikan yang telah dilakukan.

---

## 3. Alur Deployment & Verifikasi Berhasil Terdeploy
1. **Cloud CI/CD & Anti-Server Load**: Seluruh build bundle & image produksi dilakukan di cloud GitHub Actions runner. Dilarang build lokal (`npm run build`) agar tidak mengotori direktori lokal dengan folder `dist/`.
2. **Wajib Memastikan Berhasil Terdeploy**: Agent wajib memverifikasi bahwa perubahan berhasil terdeploy secara sempurna di lingkungan produksi (build GitHub Actions sukses, webhook Coolify terpanggil, dan kontainer Frontend di VPS telah ter-refresh dan berstatus running/healthy).

---

## 4. Standar Fokus Eksklusif pada Website/Layanan Aktif (Anti-Ganggu Layanan Tidur)
1. **Hanya Kerjakan Layanan yang Sedang Berjalan (Active / Running Only):**
   - Setiap tugas pengerjaan, penambahan fitur, konfigurasi, debugging, atau perbaikan HANYA boleh difokuskan pada website, aplikasi, atau kontainer yang saat ini sedang aktif/berjalan (*running* di server).
2. **Larangan Menyentuh Website/Layanan yang Mati ("Sedang Ditidurkan"):**
   - Jika ada website, repositori, sub-aplikasi, atau kontainer yang berstatus mati (*exited*, *stopped*, atau sengaja dinonaktifkan/ditidurkan oleh USER):
     - **Dilarang keras menyentuh, mengubah file/kode, mengubah rute proxy/DNS, mencoba menghidupkan, atau mengotak-atiknya.**
     - Biarkan layanan tersebut tetap dalam kondisi tidur/non-aktif (*leave sleeping services untouched*), kecuali jika USER secara eksplisit dan tertulis memberikan perintah untuk mengaktifkan kembali layanan tersebut.

---

## 5. Standar Isolasi Ketat Database Multi-Tenant & Perlindungan Hapus Data (Anti-Hapus Silang Tenant)
1. **Prinsip Isolasi Mutlak Database per Tenant (Zero Cross-Database Interference):**
   - Server memiliki banyak database terisolasi untuk masing-masing tenant (`dimsum_db`, `akasia_db`, `barakahfood_db`, `proship_db`, `otgbracket_db`, `tauheednews_db`, `proteksales_db`, dsb.).
   - Frontend tenant ini beroperasi khusus untuk tenant Dimsum Intan dan berkomunikasi dengan `dimsum_db`.
   - **Dilarang Keras menyentuh, membaca, mengubah, memigrasi, atau menghapus database lain yang tidak bersangkutan.**
2. **Prosedur Pengamanan Ketat Permintaan Hapus Seluruh Data (Data Wipe Guardrail):**
   - Jika USER meminta untuk *"hapus seluruh data"*, *"reset database"*, atau *"kosongkan data"*:
     - **Wajib Validasi Database Target**: Agent WAJIB secara eksplisit mengunci koneksi hanya ke database target yang diminta. Dilarang keras menjalankan perintah database tanpa nama database yang spesifik.
     - **Larangan Hapus Silang Tenant**: Operasi pembersihan data (`TRUNCATE` / `DELETE`) HANYA boleh dieksekusi pada tabel-tabel di dalam database tenant yang dimaksud. Dilarang keras menyentuh database tenant lain.
     - **Verifikasi Integritas**: Sebelum dan sesudah operasi penghapusan, agent wajib memverifikasi bahwa database tenant lain tetap utuh 100% tanpa ada data yang terhapus atau berubah.
