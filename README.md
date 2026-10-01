# FiNOVA

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

### 4. 🎯 Target Pembelian (Wishlist & Nabung Impian)
Fitur perencanaan barang impian untuk menabung secara disiplin dan bertahap:
- **Pilihan Cepat Inspirasi Target**: Tombol preset siap pakai untuk Smartphone, Laptop, Motor, Liburan, Dana Darurat, dan Sepatu.
- **Pencatatan Target Barang**: Nama barang, estimasi harga, kategori, dan target tanggal tercapai.
- **Indikator Progres Visual**: Progress bar real-time, persentase ketercapaian, sisa uang yang dibutuhkan, dan status perayaan saat target telah tercapai.
- **Rekomendasi Tabungan Cerdas**: Menghitung estimasi nominal yang perlu disisihkan per hari/minggu berdasarkan batas waktu yang ditentukan.
- **Setor Tabungan Cepat (+ Nabung)**: Pilihan nominal cepat (+20rb, +50rb, +100rb, +250rb, +500rb, +1jt) dan opsi pencatatan otomatis ke riwayat transaksi kategori Tabungan.
- **Tarik Dana / Sesuaikan Tabungan**: Fleksibilitas jika ada kebutuhan mendesak.
- **Widget Target di Dashboard**: Ringkasan target teratas langsung di layar utama.

### 5. 📊 Laporan Keuangan & Visual Charts (Didukung Chart.js)
- **Pilihan Periode Fleksibel**: `Hari ini`, `Minggu ini`, `Bulan ini`, `Semua`.
- **Grafik Tren Arus Kas Interaktif (Bar & Line Toggle)**: Beralih bebas antara grafik batang dan kurva garis halus membandingkan pemasukan dan pengeluaran secara periodik dengan tooltip interaktif berformat Rupiah.
- **Grafik Donut Alokasi Pengeluaran per Kategori**: Visualisasi Doughnut interaktif yang memetakan persentase dan nominal pengeluaran terbesar per kategori.
- **Grafik Donut Rasio Arus Kas**: Proporsi perbandingan pemasukan vs pengeluaran serta persentase Rasio Tabungan (*Savings Rate*).
- **Grafik Progres Target Pembelian**: Grafik perbandingan visual horizontal yang memantau perkembangan seluruh barang impian yang sedang ditabung.
- **Metrik Finansial Cerdas**: Status kesehatan kas (*Sehat / Waspada / Defisit*), Rasio Tabungan, dan estimasi Rata-rata Pengeluaran per Hari.

### 6. 🏷️ Kategori
- **Kategori Pemasukan Bawaan**: Gaji, Driver, Freelance, Bonus, Penjualan, Lainnya.
- **Kategori Pengeluaran Bawaan**: Makanan, Bensin, Transportasi, Tagihan, Belanja, Hiburan, Kesehatan, Tabungan, Lainnya.
- **Kategori Kustom**: Pengguna dapat menambahkan kategori baru sendiri kapan saja.

### 7. ⚙️ Pengaturan & Manajemen Data
- **Export CSV**: Unduh pembukuan ke berkas CSV yang kompatibel dengan Microsoft Excel dan Google Sheets (UTF-8 BOM).
- **Backup Data (JSON)**: Unduh cadangan seluruh transaksi, kategori, dan target pembelian ke file `.json`.
- **Import Data (JSON)**: Pulihkan seluruh data transaksi dan target dari file cadangan `.json`.
- **Hapus Semua Data**: Reset total transaksi dan target dengan dialog konfirmasi aman.
- **Mode Gelap (Dark Mode)**: Tema gelap yang nyaman untuk penggunaan malam hari.

### 8. 📲 Progressive Web App (PWA) Standalone
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
