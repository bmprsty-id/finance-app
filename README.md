# Finance Tracker

Aplikasi pencatatan keuangan pribadi yang **sederhana, cepat dipakai, dan berfokus pada pencatatan serta kondisi keuangan**. Dirancang khusus agar pengguna (driver, freelancer, pekerja harian, maupun pelaku usaha kecil) dapat mencatat transaksi dalam beberapa detik tanpa ribet, tanpa login, dan tanpa server backend.

---

## Struktur Menu & Fitur Utama

Aplikasi menggunakan navigasi bawah (*Bottom Navigation*) bergaya mobile-first yang praktis dan intuitif:

### 1. 🏠 Dashboard (Halaman Utama)
- **Ringkasan Saldo**: Menampilkan Saldo Bersih secara besar dan jelas.
- **Pemasukan & Pengeluaran**: Kartu ringkasan total pemasukan dan total pengeluaran dalam format Rupiah (`Rp2.450.000`).
- **Transaksi Terbaru**: Menampilkan 4-5 transaksi terakhir yang dicatat secara langsung.
- **Tombol Pintas "+ Catat Transaksi Baru"**: Akses instan untuk langsung mencatat.

### 2. ➕ Tambah Transaksi (Pusat Aplikasi)
Form input yang efisien untuk mencatat dalam beberapa detik:
- **Jenis Transaksi**: Pilihan cepat `[ Pemasukan ]` atau `[ Pengeluaran ]`.
- **Nominal**: Input angka besar dan jelas dengan awalan `Rp`.
- **Kategori**: Pilihan kategori bawaan dan kemampuan menambah kategori baru.
- **Tanggal**: Otomatis terisi tanggal hari ini (*bisa diubah jika perlu*).
- **Catatan**: Field catatan singkat opsional.

### 3. 📋 Riwayat Transaksi
- **Pengelompokan Berdasarkan Tanggal**: Transaksi dikelompokkan per hari dan bulan dengan subtotal harian.
- **Search Bar**: Pencarian cepat berdasarkan kategori atau catatan teks.
- **Filter Jenis**: Filter instan `[ Semua ]`, `[ Pemasukan ]`, `[ Pengeluaran ]`.
- **Filter Rentang Tanggal**: Memilih tanggal mulai dan tanggal akhir secara fleksibel.
- **Aksi Transaksi**: Tombol **Edit Transaksi** dan **Hapus Transaksi** dengan konfirmasi dialog aman.

### 4. 📊 Laporan Keuangan
- **Pilihan Periode**: `Hari ini`, `Minggu ini`, `Bulan ini`, `Semua`.
- **Ringkasan Periode**: Total Pemasukan, Total Pengeluaran, dan Selisih Bersih (*Net*).
- **Breakdown Kategori**: Persentase pengeluaran dan pemasukan per kategori dengan grafik progress bar visual.

### 5. 🏷️ Kategori
- **Kategori Pemasukan Bawaan**: Gaji, Driver, Freelance, Bonus, Penjualan, Lainnya.
- **Kategori Pengeluaran Bawaan**: Makanan, Bensin, Transportasi, Tagihan, Belanja, Hiburan, Kesehatan, Lainnya.
- **Kategori Kustom**: Pengguna dapat menambahkan kategori baru sendiri kapan saja.

### 6. ⚙️ Pengaturan & Manajemen Data
- **Export CSV**: Unduh pembukuan ke berkas CSV yang kompatibel dengan Microsoft Excel dan Google Sheets (UTF-8 BOM).
- **Backup Data (JSON)**: Unduh cadangan seluruh transaksi dan kategori ke file `.json`.
- **Import Data (JSON)**: Pulihkan riwayat transaksi dari file cadangan `.json`.
- **Hapus Semua Data**: Reset total dengan dialog konfirmasi.
- **Mode Gelap (Dark Mode)**: Tema gelap yang nyaman untuk penggunaan malam hari.

### 7. 📲 Progressive Web App (PWA) Standalone
- **Dukungan PWA Penuh**: Dapat diinstal di Android, iOS, Windows, Mac, dan Linux.
- **Tampilan Rapi & Layar Penuh (*Standalone*)**: Membuka aplikasi tanpa address bar browser layaknya aplikasi native.
- **Offline First**: Dilengkapi Service Worker caching sehingga aplikasi tetap terbuka saat tidak ada sinyal.
- **In-App Install Banner & Header Button**: Tombol pasang cepat satu klik serta panduan khusus bagi pengguna iPhone/iPad di Safari.
- **Safe Area Insets**: Mendukung notch dan home indicator pada smartphone modern.

---

## Tech Stack

- **HTML5**: Semantik modern, ramah aksesibilitas.
- **CSS3**: Vanilla CSS murni dengan CSS custom properties, Mobile-first Layout, Safe Area Insets, dan Dark Mode support.
- **JavaScript**: Vanilla ES6+ murni tanpa framework eksternal.
- **Local Storage API**: Penyimpanan persisten di browser pengguna.
- **PWA (Vite PWA & Service Worker)**: Web App Manifest, CacheFirst Google Fonts, and offline precaching.

---

## Keamanan & Privasi Data

Seluruh data transaksi dan pengaturan tersimpan secara lokal di browser perangkat Anda (`localStorage`):
- Tidak ada data yang dikirim ke server luar atau cloud.
- Tidak membutuhkan email, password, maupun akun.
- Data sepenuhnya berada di kendali perangkat Anda.

---

## Cara Menjalankan Secara Lokal (Run Locally)

1. Unduh atau clone repositori ini ke komputer Anda.
2. Buka berkas `index.html` dengan klik ganda atau menggunakan Live Server di VS Code.
3. Atau jalankan local web server:
   ```bash
   npx serve .
   ```

---

## Panduan Deployment ke Vercel

Proyek ini telah siap untuk **Static Deployment** langsung di Vercel:

1. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: simple & fast finance tracker"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```

2. **Deploy di Vercel**:
   - Masuk ke [Vercel](https://vercel.com) $\rightarrow$ **"Add New..."** $\rightarrow$ **"Project"**.
   - Pilih repositori GitHub Anda.
   - Pilih preset **Other** (Static Site), biarkan build command kosong.
   - Klik **Deploy**.
