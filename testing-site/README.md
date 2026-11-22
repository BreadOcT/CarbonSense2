# 🧪 CarbonSense Standalone UI Testing Site (Decoupled Prototype)

Folder ini adalah **Testing Site Statis Berbasis HTML/JS** untuk proyek **CarbonSense** yang sepenuhnya **terpisah (*decoupled*) dari backend Express/Node.js, database MySQL/Supabase, maupun hardware ESP32 fisik**.

Situs pengujian ini dirancang agar Anda dapat menguji, mendemonstrasikan, dan mengeksplorasi seluruh tampilan dan interaktivitas User Interface (UI) dari tahap awal hingga akhir secara langsung di peramban web modern tanpa perlu menjalankan server backend.

---

## 🚀 Cara Menjalankan

Anda cukup membuka file **`index.html`** langsung di peramban web (Google Chrome, Microsoft Edge, Mozilla Firefox, dll.):

1. Buka File Explorer ke folder:
   `c:\Users\victus\Downloads\toto\projects\magicpath-project\testing-site`
2. Klik ganda (**double-click**) pada file **`index.html`**
3. Atau jalankan server statis lokal jika diinginkan:
   ```bash
   # Menggunakan Python
   python -m http.server 8080 --directory testing-site

   # Menggunakan npx
   npx serve testing-site
   ```
4. Buka `http://localhost:8080` di browser Anda.

---

## 📑 Peta Halaman & Alur Pengujian Lengkap

| No | File Halaman | Nama / Peran | Apa Saja yang Bisa Dilakukan di UI Ini? |
|---|---|---|---|
| 1 | **`index.html`** | **Landing Page** | • Melihat informasi produk IoT & AI<br>• Mencoba simulator gas interaktif (Normal, Waspada, Bahaya) langsung di hero card<br>• Menjelajahi 4 langkah proses penyiapan dan arsitektur fitur<br>• Navigasi cepat ke pendaftaran, login pengguna, atau admin portal |
| 2 | **`login.html`** | **Portal Masuk Pengguna** | • Form login dengan validasi email regex & password<br>• Tombol **Auto-Fill Kredensial Demo** (`user@carbonsense.id`)<br>• Toggle lihat/sembunyikan password |
| 3 | **`register.html`** | **Registrasi Akun Baru** | • Form pendaftaran lengkap nama, email, dan password (min. 6 karakter)<br>• Tombol **Auto-Fill Akun Uji Coba**<br>• Otomatis mengarahkan ke alur Onboarding untuk pengguna baru |
| 4 | **`onboarding.html`** | **Kuesioner Adaptasi AI (7 Langkah)** | • Menjawab 7 kuesioner interaktif (Lokasi, Sirkulasi AC/Jendela, Kapasitas Hunian, Polutan, Kelompok Rentan, Luas, Detektor)<br>• Animasi pemrosesan kalkulasi risiko Gemini AI<br>• Tampilan ringkasan profil AI adaptif & penentuan otomatis mode sensitivitas (Tinggi vs Normal)<br>• Efek perayaan konfeti saat konfigurasi selesai |
| 5 | **`select-device.html`** | **Pilih & Tautkan Hardware** | • Melihat inventori perangkat sensor tertaut (`CS-ESP32-LIVING-01`, dll.)<br>• Mengubah nama pengenal pemilik alat<br>• Memilih perangkat aktif untuk dibuka di dashboard<br>• Modal tautkan hardware baru via penginputan ID fisik atau simulasi scan QR |
| 6 | **`dashboard.html`** | **Dashboard Monitoring Utama** | • **Widget Telemetri Real-Time**: Meteran gas PPM animasi hidup, suhu, kelembaban, indeks VOC<br>• **Simulator Skenario Langsung**: Tombol 1-klik Normal (420 PPM), Waspada (850 PPM), dan Bahaya (1280 PPM)<br>• **Fluktuasi Sensor Alami**: Fluktuasi nilai PPM dinamis tiap 3 detik<br>• **Asisten AI Interaktif**: Rekomendasi mitigasi Gemini AI real-time & kotak chat interaktif dengan *prompt chips*<br>• **Grafik Tren Historis (Chart.js)**: Filter rentang 1 Jam, 24 Jam, 7 Hari<br>• **Ekspor Laporan**: Tombol unduh laporan resmi **PDF** dan tabel **CSV/Excel** instan<br>• **Sirene Darurat (Hazard Modal)**: Alarm visual berkedip merah saat PPM > 1000 lengkap dengan suara sirene audio sintetis (Web Audio API)<br>• **Panduan WiFi ESP32**: Walkthrough 5 langkah aktivasi hardware |
| 7 | **`settings.html`** | **Pengaturan Sensitivitas AI** | • Menyesuaikan kembali status kelompok rentan, sirkulasi ruangan, dan sumber polutan<br>• Pembaruan otomatis indikator status risiko (*High Sensitivity vs Normal*)<br>• Menyimpan preferensi ke penyimpanan simulasi lokal |
| 8 | **`profile.html`** | **Profil & Keamanan Akun** | • Mengubah nama lengkap akun pengguna<br>• Form uji ganti kata sandi dengan validasi kecocokan sandi<br>• Tombol Reset Data Sesi Pengujian untuk memulai ulang dari awal |
| 9 | **`admin-login.html`** | **Portal Khusus Administrator** | • Halaman autentikasi terpisah untuk administrator sistem<br>• Tombol Auto-Fill akun pengelola (`admin@carbonsense.id`) |
| 10 | **`admin-dashboard.html`** | **Konsol Manajemen Registry Alat** | • Kartu statistik global (total alat, online, waspada, pengguna)<br>• Filter pencarian kata kunci dan status alat (Online, Warning, Offline)<br>• **Modal Tambah Alat**: Mendaftarkan Device ID baru & acak ID generator<br>• **Modal QR Code**: Generator QR Code nyata untuk stiker tempel fisik hardware<br>• **Modal Source Code C++**: Tampilan dan tombol salin source code firmware Arduino ESP32 (`.ino`)<br>• Aksi hapus perangkat dari registry |

---

## 🌓 Fitur Mode Terang & Mode Gelap (Light / Dark Mode)

Situs pengujian kini dilengkapi dengan **Mode Terang (Light Mode)** dan **Mode Gelap (Dark Mode)** yang tersinkronisasi otomatis di seluruh halaman:
- **Tombol di Header**: Setiap halaman memiliki tombol toggle instan `☀️ Mode Terang` / `🌙 Mode Gelap` di bilah navigasi atas.
- **Pengaturan di Testing HUD**: Di dalam panel `Testing Site Tools`, Anda juga dapat mengganti tema via tombol `☀️ Terang` dan `🌙 Gelap`.
- **Grafik Adaptif**: Pada halaman `dashboard.html`, grafik garis telemetri gas PPM otomatis menyesuaikan warna garis, grid, dan tooltip agar tetap jelas terbaca di latar belakang putih.
- **Penyimpanan Status**: Preferensi tema disimpan di `localStorage` (`cs_theme`), sehingga pilihan Anda tetap tersimpan saat berpindah halaman atau me-refresh peramban.

---

## 🛠️ Fitur Khusus: Testing Site Tools (Floating HUD)

Di setiap halaman, di **pojok kanan bawah**, terdapat tombol mengambang:
```
[ 🛠️ Testing Site Tools ]
```
Saat diklik, panel pengendali pengujian akan terbuka dan memberikan kemudahan:
1. **Navigasi 1-Klik**: Loncat ke halaman mana saja tanpa harus melewati alur login berulang-ulang.
2. **Pengubah Nilai Sensor Cepat**:
   - `🟢 425 PPM` (Kondisi Aman / Normal)
   - `🟡 850 PPM` (Kondisi Waspada)
   - `🔴 1250 PPM` (Kondisi Bahaya - Otomatis memicu alarm sirene)
   - `🔌 Ubah Status Koneksi` (Uji respons UI saat alat offline)
3. **Reset Skenario**:
   - *Mode Pengguna Baru*: Mengosongkan status onboarding agar Anda bisa menguji alur wizard dari langkah ke-1.
   - *Reset Seluruh Data*: Mengembalikan seluruh inventori dan profil ke konfigurasi awal standar.

---

## 📁 Struktur Berkas

```
magicpath-project/
├── testing-site/
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css          # Styling kustom, variabel tema, animasi sirene, glassmorphism
│   │   └── js/
│   │       ├── mock-data.js        # Pusat penyimpanan data simulasi (localStorage & model AI respons)
│   │       └── testing-nav.js      # Toolbar HUD melayang pengendali pengujian di seluruh halaman
│   ├── index.html                  # Halaman Beranda (Landing Page)
│   ├── login.html                  # Halaman Login Pengguna
│   ├── register.html               # Halaman Pendaftaran Akun
│   ├── onboarding.html             # Kuesioner Adaptasi AI (7 Langkah)
│   ├── select-device.html          # Pemilihan & Penautan Alat Monitor
│   ├── dashboard.html              # Dasbor Monitoring Telemetri Sensor & AI
│   ├── settings.html               # Konfigurasi Ulang Sensitivitas AI
│   ├── profile.html                # Profil Akun & Ganti Password
│   ├── admin-login.html            # Portal Masuk Administrator
│   ├── admin-dashboard.html        # Registry Inventori Hardware & Cetak QR
│   └── README.md                   # Dokumentasi panduan pengujian ini
```

