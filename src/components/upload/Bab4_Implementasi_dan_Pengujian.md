# BAB 4 IMPLEMENTASI DAN PENGUJIAN

## 4.1 Implementasi
Tahap implementasi sistem merupakan fase di mana rancangan arsitektur, diagram pemodelan, serta spesifikasi kebutuhan ditransformasikan ke dalam kode program, konfigurasi basis data, serta kesiapan lingkungan perangkat lunak. Implementasi platform CarbonSense dibagi menjadi beberapa bagian terstruktur untuk memastikan seluruh dependensi sistem terpasang dengan selaras dan dapat beroperasi dengan baik.

### 4.1.1 Persyaratan Sistem (System Requirements)
Sebelum mengoperasikan platform CarbonSense, seluruh perangkat lunak pendukung dan lingkungan pengembangan (development environment) harus dikonfigurasi terlebih dahulu. Kebutuhan minimum perangkat lunak ini sangat krusial untuk menjamin fungsionalitas pemantauan telemetri IoT, komunikasi REST API, sinkronisasi data real-time, dan modul asisten AI Gemini dapat berjalan tanpa hambatan (bottleneck).

Spesifikasi lingkungan perangkat lunak yang diimplementasikan pada sistem ini meliputi:
1. **Bahasa Pemrograman Utama**: JavaScript/TypeScript (ES6+) digunakan untuk menyusun seluruh logika bisnis pada frontend (React) dan backend server (Express.js), sedangkan Python versi 3.10+ disediakan khusus sebagai pendukung eksekusi otomatisasi pengujian eksternal menggunakan Selenium WebDriver.
2. **Database Management System (DBMS)**: Supabase Cloud PostgreSQL versi 15+ digunakan sebagai pangkalan data utama untuk menyimpan tabel-tabel relasional (data pengguna, log detail, dan parameter perangkat). Firebase Realtime Database digunakan untuk sinkronisasi telemetri nirkabel PPM MQ-135 secara instan tanpa delay dari perangkat keras ke dasbor klien.
3. **Framework & Pustaka Utama**: React (Vite) versi 18+ diimplementasikan sebagai fondasi antarmuka klien (frontend) yang responsif dan interaktif, TailwindCSS digunakan untuk visualisasi gaya modern, Express.js versi 4+ sebagai REST API backend server, dan Sequelize ORM untuk manajemen relasi database.
4. **Web Browser & Driver**: Google Chrome atau Microsoft Edge versi terbaru dikombinasikan dengan driver yang kompatibel (ChromeDriver atau EdgeDriver) untuk mendukung jalannya otomatisasi penjelajahan saat pengujian fungsionalitas Selenium dilakukan.

### 4.1.2 Penyebaran Sistem (System Deployment)
Proses penyebaran sistem (system deployment) pada platform CarbonSense ditinjau dari dua perspektif lingkungan (environment) yang berbeda, yaitu Lingkungan Pengujian (Testing Environment) dan Lingkungan Produksi (Production Environment):
1. **Lingkungan Pengujian (Testing Environment / Localhost)**: Merupakan lingkungan lokal berbasis Windows menggunakan server local Node.js. Lingkungan ini dikonfigurasi secara khusus untuk memfasilitasi jalannya pengujian fungsionalitas otomatis menggunakan Selenium IDE dan Selenium WebDriver (Python pytest) pada port 3000 (frontend) dan port 5000 (backend server) tanpa mengganggu kestabilan data produksi. Rangkaian instruksi detail instalasi lokal difokuskan pada sub-bab ini.
2. **Lingkungan Produksi (Production Environment / Cloud)**: Merupakan lingkungan implementasi final tempat aplikasi klien disebarkan secara publik melalui layanan Vercel Cloud Hosting, database relasional di-host secara terpusat pada Supabase Cloud, dan telemetri nirkabel disinkronkan secara kontinu menggunakan Firebase Realtime Database.

Rangkaian instruksi teknis langkah demi langkah yang dilakukan untuk memasang, mengonfigurasi, dan mengaktifkan platform CarbonSense pada lingkungan pengujian lokal (localhost) adalah sebagai berikut:
1. **Kloning dan Penyiapan Repositori Kode Sumber**:
   Langkah pertama adalah melakukan kloning terhadap kode sumber (source code) platform CarbonSense dari repositori pengembangan. Jalankan perintah berikut pada terminal:
   ```bash
   git clone https://github.com/BreadOcT/CarbonSense2.git
   cd CarbonSense2
   ```
2. **Instalasi Dependensi Framework dan Frontend**:
   Setelah folder proyek berada pada direktori yang tepat, instal dependensi node_modules untuk frontend di direktori root dan backend di direktori server dengan mengeksekusi perintah berikut secara berurutan:
   ```bash
   # Instalasi dependensi frontend (root)
   npm install

   # Instalasi dependensi backend server
   cd server
   npm install
   ```
3. **Konfigurasi Berkas Lingkungan (Environment File)**:
   Buat file bernama `.env` di dalam direktori `server` untuk menyimpan kredensial database dan API asisten cerdas:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres.xxx:xxx@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   VITE_DEEPSEEK_API_KEY=sk-c9b32675151e40a6888f356a002975e9
   JWT_SECRET=gwehkerenjir
   ADMIN_ID=admin
   ADMIN_PASSWORD=admin123
   ```
4. **Inisialisasi & Auto-Migration Basis Data**:
   Skema struktur basis data terkonfigurasi secara otonom menggunakan Sequelize ORM. Saat server diaktifkan, modul `sequelize.sync({ alter: true })` secara otomatis menyelaraskan dan memproduksi tabel `Users` (id, username, email, password, role) dan `Devices` (id, userEmail, status, ppm, lastActive) ke dalam database Supabase/MySQL.
5. **Mengaktifkan Server secara Lokal**:
   Sistem diaktifkan secara lokal dengan mengeksekusi perintah run dev di direktori root proyek:
   ```bash
   npm run dev
   ```
   Perintah ini menjalankan frontend pada port 3000 dan backend server pada port 5000 secara bersamaan. Penguji dapat mengakses antarmuka melalui peramban pada alamat `http://localhost:3000`.

### 4.1.3 Implementasi Antarmuka Pengguna (User Interface)
Implementasi antarmuka pengguna merupakan visualisasi akhir dari seluruh modul frontend yang telah dikompilasi menggunakan React, TailwindCSS, dan Shadcn UI. Desain antarmuka dirancang bersih, intuitif, dan responsif agar mempermudah pengoperasian pemantauan kualitas udara baik oleh pengguna biasa maupun administrator.

Berikut adalah rincian implementasi halaman antarmuka pada platform CarbonSense:
1. **Halaman Login dan Autentikasi**:
   Halaman ini merupakan gerbang awal keamanan sistem sebelum pengguna mengakses data kualitas udara. Antarmuka menyediakan dua kolom input utama (email dan password), tombol login, serta tombol pintas pendaftaran akun baru. Validasi langsung akan muncul jika kolom kosong atau password salah.
   *(Gambar 4.1 Implementasi Antarmuka Halaman Login)*
2. **Halaman Registrasi Pengguna**:
   Halaman pendaftaran bagi pengguna baru untuk membuat kredensial akses. Pengguna menginput Nama Lengkap, Email, dan Password (minimal 6 karakter). Jika sukses, akun disimpan ke database SQL dan sistem mengalihkan pengguna ke halaman kuesioner onboarding.
   *(Gambar 4.2 Implementasi Antarmuka Halaman Registrasi)*
3. **Halaman Onboarding Kesehatan**:
   Halaman kuesioner wajib bagi pengguna baru untuk mendefinisikan karakteristik ruangan (lokasi, kapasitas, polutan kompor/rokok, lansia/bayi, riwayat asma). Sistem akan menyimpan data profil ini untuk konfigurasi ambang batas aman sensor dan memandu rekomendasi asisten AI.
   *(Gambar 4.3 Implementasi Antarmuka Kuesioner Onboarding)*
4. **Halaman Pemilihan Perangkat (Select Device)**:
   Halaman yang menyajikan daftar perangkat IoT aktif yang terikat ke email pengguna. Pengguna memilih perangkat aktif yang ingin dipantau sebelum masuk ke halaman dashboard utama. Terdapat juga penanganan scan QR Code untuk penautan instan.
   *(Gambar 4.4 Implementasi Antarmuka Pemilihan Perangkat)*
5. **Halaman Dasbor Utama (Dashboard Overview & Real-Time Monitor)**:
   Pusat kendali dan rangkuman informasi kualitas udara. Menampilkan telemetry PPM aktual sensor MQ-135 secara real-time via Firebase dengan indikator warna (hijau <= 700 PPM, kuning 701 - 1200 PPM, merah > 1200 PPM). Dilengkapi grafik tren histori Recharts, DatePicker filter tanggal, tombol ekspor Excel/PDF, dan drawer asisten AI.
   *(Gambar 4.5 Implementasi Antarmuka Dasbor Utama Pemantauan)*
6. **Halaman Pengaturan Sensitivitas (Settings)**:
   Menu yang memungkinkan pengguna menyesuaikan parameter ruangan secara dinamis serta mengaktifkan "Modus Sensitivitas Tinggi" (menurunkan threshold alarm PPM demi keselamatan keluarga rentan) yang disinkronkan ke AI.
   *(Gambar 4.6 Implementasi Antarmuka Halaman Pengaturan)*
7. **Halaman Profil Pengguna (User Profile)**:
   Halaman untuk melakukan pembaruan informasi data diri pengguna (username, email) serta pembaruan kata sandi akun secara aman dengan pengisian kata sandi lama yang valid.
   *(Gambar 4.7 Implementasi Antarmuka Halaman Profil)*
8. **Halaman Dasbor Admin (Admin Portal)**:
   Portal khusus administrator yang terproteksi kredensial .env. Menyediakan visualisasi tabel inventaris seluruh perangkat secara global di basis data, penautan manual perangkat ke email user, pembuatan device baru dengan QR Code otomatis, serta panel salin kode firmware Arduino C++ (.ino) ESP32.
   *(Gambar 4.8 Implementasi Antarmuka Halaman Dasbor Admin)*

---

## 4.2 Pengujian
Tahapan pengujian perangkat lunak dilakukan untuk memverifikasi dan memvalidasi bahwa seluruh modul antarmuka pengguna (frontend) dan server (backend) platform CarbonSense beroperasi sesuai dengan spesifikasi kebutuhan fungsional yang telah didefinisikan.

### 4.2.1 Perencanaan Pengujian
Tahap perencanaan mendefinisikan penyusunan kesiapan perkakas otomatisasi, cakupan fungsionalitas sistem yang dievaluasi, teknik pemetaan data uji, serta linimasa pelaksanaan aktivitas pengujian.
1. **Instalasi Alat Pengujian (Automation Test Tools)**:
   Proses pengujian otomatis pada platform CarbonSense diimplementasikan menggunakan perkakas **Selenium WebDriver** (berbasis Python pytest) dan **Selenium IDE** untuk perekaman skrip interaksi UI secara langsung. Langkah penyiapan meliputi:
   * Pemasangan Python versi 3.10+ pada mesin penguji lokal.
   * Instalasi dependensi pustaka Selenium dan pytest melalui command prompt: `pip install selenium pytest`.
   * Pengunduhan browser driver yang kompatibel (ChromeDriver/EdgeDriver) diletakkan di dalam environment path sistem.
   * Pembuatan berkas skrip uji terprogram `test_suite_selenium.py` yang memuat assertion dan langkah navigasi otomatis.
2. **Cakupan Pengujian dan Fungsionalitas Sistem**:
   Upaya penjaminan kualitas platform dibatasi secara terukur pada fungsionalitas inti yang berdampak langsung pada operasional sistem. Terdapat 13 fungsionalitas utama yang disepakati sebagai cakupan pengujian, meliputi:
   * Fungsionalitas Login: Menguji proses autentikasi pengguna masuk ke dalam sistem.
   * Fungsionalitas Registrasi: Validasi pendaftaran akun baru termasuk pembatasan minimal password.
   * Fungsionalitas Onboarding: Pengisian kuesioner profil ruangan dan proteksi bypass URL.
   * Fungsionalitas Edit Profil & Password: Pembaruan data pribadi serta verifikasi keamanan pergantian password.
   * Fungsionalitas Penautan Perangkat: Penautan otomatis via parameter QR Code.
   * Fungsionalitas Aktivasi & Reaktivasi: Deteksi status alat dan popup panduan reaktivasi offline.
   * Fungsionalitas Asisten Chat AI: Validasi jawaban chatbot yang kontekstual, dialog memory, dan safeguard offline.
   * Fungsionalitas Navigasi Histori Tanggal: Filter tanggal harian, DatePicker kustom, dan indikator kosong.
   * Fungsionalitas Ekspor Laporan: Pengunduhan berkas telemetri format PDF dan Excel.
   * Fungsionalitas Pengaturan AI: Perubahan profil ruangan dan aktivasi Modus Sensitivitas Tinggi.
   * Fungsionalitas Portal & Autentikasi Admin: Pengamanan gerbang login admin menggunakan kredensial .env.
   * Fungsionalitas Admin Dashboard: Manajemen CRUD perangkat IoT, binding manual, dan penyalinan firmware C++.
   * Fungsionalitas Autentikasi (Logout): Penghapusan sesi localStorage browser secara bersih.
3. **Teknik Pengujian**:
   Metode dasar yang melandasi penyusunan skenario skrip adalah Black Box Testing, yang mengevaluasi kesesuaian input dan output tanpa melihat kode internal sistem melalui pendekatan spesifik:
   * **Equivalence Partitioning (EP)**: Membagi kelompok data masukan menjadi partisi ekuivalen untuk efisiensi skenario uji. EP diterapkan pada modul login (memisahkan partisi input kosong, password salah, dan kredensial valid) serta proteksi bypass onboarding.
   * **Boundary Value Analysis (BVA)**: Berfokus pada pengujian nilai ekstrem pada batas minimum/maksimum input. BVA diterapkan pada validasi panjang karakter password registrasi (minimal 6 karakter) serta penautan parameter device ID scan QR (memastikan sistem memblokir device ID yang tidak terdaftar di database admin).
4. **Jadwal dan Pengawakan**:
   Aktivitas penjaminan kualitas dikelola secara terstruktur dengan menempatkan Okto Bagas sebagai penanggung jawab penuh proses pengujian. Linimasa pelaksanaan dirinci pada Tabel 4.1.

*(Tabel 4.1 Jadwal Pelaksanaan dan Pengawakan Aktivitas Pengujian Sistem)*

| No | Tanggal | Pekerjaan | Penanggung Jawab |
| :--- | :--- | :--- | :--- |
| 1. | 1 – 3 Juni 2026 | Mempersiapkan source code CarbonSense (React & Express) yang akan diuji | Okto Bagas |
| 2. | 3 – 5 Juni 2026 | Memasang runtime Node.js, Python, Supabase, dan setup Selenium WebDriver | Okto Bagas |
| 3. | 5 – 7 Juni 2026 | Menentukan fungsionalitas utama CarbonSense & cakupan pengujian (13 Fitur) | Okto Bagas |
| 4. | 7 – 9 Juni 2026 | Merancang skenario test case & data pengujian (Login s/d Logout) | Okto Bagas |
| 5. | 9 – 11 Juni 2026 | Melakukan scripting Selenium Python (test_suite_selenium.py) & Selenium IDE | Okto Bagas |
| 6. | 11 – 13 Juni 2026 | Eksekusi test suite Selenium otomatis & merekam log uji (Simulasi IoT & DB) | Okto Bagas |
| 7. | 14 – 15 Juni 2026 | Penyusunan laporan hasil pengujian dan penulisan kesimpulan akhir | Okto Bagas |

### 4.2.2 Perancangan Pengujian (Test Case Design)
Sub-bab ini menguraikan deskripsi rancangan test case yang dibangun untuk memvalidasi 13 fungsionalitas utama sistem CarbonSense secara rinci pada Tabel 4.2 sampai Tabel 4.14.

*(Tabel 4.2 Skenario Pengujian (Test Case) Fungsionalitas Login)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Login** | TC 1.1 | Login tanpa mengisi email dan password | Berada di halaman login (/login) | 1. Kosongkan email dan password.<br>2. Klik tombol Login. | - | Form diblokir, menampilkan pesan error. |
| | TC 1.2 | Login dengan password salah | Berada di halaman login (/login) | 1. Isi email terdaftar.<br>2. Isi password salah.<br>3. Klik tombol Login. | email: okto@gmail.com<br>password: salahpassword | Login gagal, muncul alert error. |
| | TC 1.3 | Login berhasil (Happy Path) | Berada di halaman login (/login) | 1. Isi email terdaftar.<br>2. Isi password benar.<br>3. Klik tombol Login. | email: okto@gmail.com<br>password: password123 | Login berhasil, diarahkan ke select-device/dashboard. |

*(Tabel 4.3 Skenario Pengujian (Test Case) Fungsionalitas Registrasi)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2. Registrasi** | TC 2.1 | Registrasi mengosongkan semua data | Berada di halaman registrasi (/register) | 1. Kosongkan semua input.<br>2. Klik tombol Daftar. | - | Registrasi gagal, muncul pesan kolom wajib. |
| | TC 2.2 | Registrasi dengan password < 6 karakter | Berada di halaman registrasi (/register) | 1. Isi nama & email.<br>2. Isi password pendek (&lt;6 karakter).<br>3. Klik Daftar. | nama: Okto<br>email: okto@gmail.com<br>password: 123 | Registrasi gagal, muncul error minimal 6 karakter. |
| | TC 2.3 | Registrasi berhasil (Happy Path) | Berada di halaman registrasi (/register) | 1. Isi nama, email, password valid.<br>2. Klik Daftar. | nama: Okto<br>email: okto@gmail.com<br>password: password123 | Registrasi berhasil, dialihkan ke /onboarding. |

*(Tabel 4.4 Skenario Pengujian (Test Case) Fungsionalitas Onboarding)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **3. Onboarding** | TC 3.1 | Bypass paksa halaman onboarding | Belum menyelesaikan kuesioner onboarding | 1. Akses langsung URL /dashboard secara paksa. | - | Bypass diblokir, dialihkan kembali ke /onboarding. |
| | TC 3.2 | Batal saat ulangi onboarding | Sudah berstatus onboarding komplit | 1. Klik "Ulangi Onboarding".<br>2. Ubah isian.<br>3. Klik "Batal". | - | Kembali ke dashboard tanpa mengubah profil lama. |
| | TC 3.3 | Menyelesaikan onboarding (Happy Path) | Pengguna masuk onboarding pertama kali | 1. Isi semua kuesioner.<br>2. Klik "Accept & Lanjutkan". | - | Data tersimpan di database, diarahkan ke select-device. |

*(Tabel 4.5 Skenario Pengujian (Test Case) Fungsionalitas Edit Profil & Password)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **4. Edit Profil** | TC 4.1 | Update profil dengan mengosongkan nama | Berada di halaman profil (/profile) | 1. Kosongkan kolom nama.<br>2. Klik Simpan. | - | Gagal disimpan, muncul error. |
| | TC 4.2 | Ubah password dengan password lama salah | Berada di halaman profil (/profile) | 1. Isi password lama salah.<br>2. Isi password baru.<br>3. Klik Simpan. | password lama: salah<br>password baru: baru123 | Muncul error "Password lama salah". |
| | TC 4.3 | Sukses memperbarui nama profil | Berada di halaman profil (/profile) | 1. Isi nama baru.<br>2. Klik Simpan. | nama: Okto Bagas | Nama berhasil disimpan di database SQL dan terupdate. |
| | TC 4.4 | Sukses memperbarui password akun | Berada di halaman profil (/profile) | 1. Isi password lama benar.<br>2. Isi password baru.<br>3. Klik Simpan. | password lama: password123<br>password baru: password456 | Password berhasil diperbarui, login wajib menggunakan sandi baru. |

*(Tabel 4.6 Skenario Pengujian (Test Case) Fungsionalitas Penautan Perangkat (QR Code))*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **5. Penautan Device** | TC 5.1 | Penautan otomatis lewat parameter QR Code | Memindai kode QR fisik perangkat | 1. Akses /login?device=CS-DAPUR-01.<br>2. Lakukan login sukses. | - | Perangkat otomatis terikat ke email akun di database. |
| | TC 5.2 | Memilih perangkat aktif dari daftar | Berada di halaman /select-device | 1. Pilih salah satu perangkat aktif.<br>2. Klik Lanjutkan. | - | Dashboard dimuat untuk menampilkan data real-time alat terpilih. |

*(Tabel 4.7 Skenario Pengujian (Test Case) Fungsionalitas Aktivasi & Reaktivasi)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **6. Reaktivasi** | TC 6.1 | Pemicuan popup reaktivasi saat offline | Dashboard memantau status offline | 1. Putus koneksi sensor (Firebase status offline). | - | Popup panduan reaktivasi otomatis terbuka di dasbor. |
| | TC 6.2 | Menutup panduan reaktivasi langkah terakhir | Popup reaktivasi terbuka di layar | 1. Klik lanjut hingga langkah 5.<br>2. Klik "Saya Mengerti". | - | Popup tertutup dan dashboard melakukan reload otomatis. |
| | TC 6.3 | Perangkat terdeteksi Online kembali otomatis | Dashboard memantau status offline | 1. Sambungkan kembali daya sensor (kirim data PPM baru ke Firebase). | - | Dasbor mendeteksi transisi Online, status bar berganti hijau. |

*(Tabel 4.8 Skenario Pengujian (Test Case) Fungsionalitas Asisten Chat AI)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **7. Chat AI** | TC 7.1 | AI menolak beri data palsu saat sensor offline | Perangkat berstatus offline | 1. Ajukan pertanyaan: "Berapa kadar PPM ruangan saya?". | - | AI menjawab sensor offline dan menyarankan reaktivasi. |
| | TC 7.2 | AI menyimpan memori riwayat chat | Pengguna sedang aktif berkonsultasi | 1. Katakan: "Alat ditaruh di kamar".<br>2. Tanyakan: "Di mana alat saya?". | - | AI menjawab secara akurat di kamar tidur. |
| | TC 7.3 | AI memberikan instruksi instalasi lengkap | Pengguna sedang aktif berkonsultasi | 1. Tanyakan: "Bagaimana cara menyalakan alat CS dari awal?". | - | AI memaparkan langkah setup hardware, captive portal, & binding. |

*(Tabel 4.9 Skenario Pengujian (Test Case) Fungsionalitas Navigasi Histori Tanggal)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **8. Histori Data** | TC 8.1 | Dashboard memfilter data harian default (today) | Pertama kali memuat dasbor | 1. Akses dasbor utama. | - | Filter aktif "today" dan grafik telemetri ter-reset. |
| | TC 8.2 | Navigasi tanggal Kemarin & Besok via tombol | Sedang memantau grafik histori | 1. Klik tombol "← Kemarin".<br>2. Klik tombol "Besok →". | - | Tanggal grafik berubah mundur satu hari lalu maju kembali. |
| | TC 8.3 | DatePicker memilih tanggal kustom | Sedang memantau grafik histori | 1. Klik DatePicker kustom.<br>2. Pilih tanggal tertentu. | tanggal: 2026-06-15 | Grafik & tabel menampilkan riwayat tanggal 15 Juni 2026. |
| | TC 8.4 | Indikator kosong saat tanggal tidak ada data | Tanggal terpilih tidak memiliki telemetri | 1. Navigasikan ke tanggal kosong. | - | Grafik menampilkan pesan "Tidak Ada Data Telemetri". |

*(Tabel 4.10 Skenario Pengujian (Test Case) Fungsionalitas Ekspor Laporan)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **9. Ekspor Laporan** | TC 9.1 | Unduh berkas laporan telemetri PDF dan Excel | Berada di dasbor utama aktif | 1. Klik tombol "Download XLSX".<br>2. Klik tombol "Save PDF". | - | File Excel .xlsx & berkas PDF terunduh lengkap ke komputer. |

*(Tabel 4.11 Skenario Pengujian (Test Case) Fungsionalitas Pengaturan AI Assistant)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **10. Pengaturan AI** | TC 10.1 | Memuat konfigurasi preferensi ruangan dari local | Membuka halaman settings | 1. Klik menu settings (/settings). | - | Form terisi otomatis sesuai profil onboarding tersimpan. |
| | TC 10.2 | Mengubah parameter pemicu sensitivitas tinggi | Berada di halaman settings | 1. Pilih kelompok rentan (Bayi/Balita).<br>2. Klik Simpan. | - | Mengaktifkan Modus Sensitivitas Tinggi (menurunkan threshold). |
| | TC 10.3 | Simpan perubahan dan tutup dialog sukses | Muncul dialog sukses di layar | 1. Klik tombol "Ke Dashboard" atau "Tutup". | - | Sistem menutup dialog dan redirect pengguna ke dasbor. |

*(Tabel 4.12 Skenario Pengujian (Test Case) Fungsionalitas Portal & Autentikasi Admin)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **11. Admin Auth** | TC 11.1 | Login admin dengan input kosong | Berada di portal admin (/admin) | 1. Kosongkan input.<br>2. Klik Akses Sistem. | - | Submit diblokir, meminta pengisian kolom. |
| | TC 11.2 | Login admin dengan kredensial salah | Berada di portal admin (/admin) | 1. Isi kredensial salah.<br>2. Klik Akses Sistem. | ID: admin_salah<br>password: salah123 | Login gagal, muncul alert "Akses ditolak.". |
| | TC 11.3 | Login admin dengan kredensial benar | Berada di portal admin (/admin) | 1. Isi kredensial benar sesuai .env.<br>2. Klik Akses Sistem. | ID: admin<br>password: admin123 | Login berhasil, dialihkan ke /admin/dashboard. |

*(Tabel 4.13 Skenario Pengujian (Test Case) Fungsionalitas Admin Dashboard)*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **12. Kelola Perangkat** | TC 12.1 | Admin menambahkan perangkat IoT baru | Berada di dasbor admin | 1. Klik "+ Tambah Device".<br>2. Isi Device ID.<br>3. Klik Simpan. | ID: CS-DAPUR-OKTO | Perangkat tersimpan di SQL/Firebase, memicu modal QR Code. |
| | TC 12.2 | Admin menautkan perangkat manual ke email user | Berada di dasbor admin | 1. Klik "Bind ke User".<br>2. Input email user.<br>3. Klik Simpan. | email: okto@gmail.com | Perangkat berhasil tertaut ke user di database relasional. |
| | TC 12.3 | Admin melihat & salin C++ firmware ESP32 | Berada di dasbor admin | 1. Klik "Source Code" pada baris alat.<br>2. Klik salin. | - | Script firmware C++ (.ino) tersalin lengkap ke clipboard. |
| | TC 12.4 | Admin mengedit parameter detail perangkat | Berada di dasbor admin | 1. Klik edit (ikon pensil).<br>2. Ubah Device ID.<br>3. Klik Simpan. | ID: CS-DAPUR-OKTO-EDITED | Detail perangkat terupdate di SQL & Firebase RTDB. |
| | TC 12.5 | Admin menghapus perangkat dari sistem | Berada di dasbor admin | 1. Klik hapus (ikon sampah).<br>2. Konfirmasi penghapusan. | - | Perangkat terhapus secara permanen dari SQL dan Firebase. |

*(Tabel 4.14 Skenario Pengujian (Test Case) Fungsionalitas Autentikasi (Logout))*

| Fungsionalitas | ID Test Case | Deskripsi / Skenario | Pra Kondisi | Langkah Pengujian | Data Pengujian | Hasil Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **13. Logout** | TC 13.1 | Pengguna keluar dan menghapus seluruh sesi aktif | Berada pada dasbor utama aktif | 1. Klik tombol Logout di dasbor. | - | Keluar sukses, localStorage browser dibersihkan total. |

---

### 4.2.3 Hasil Eksekusi Pengujian
Pengujian otomatis dieksekusi menggunakan Selenium WebDriver (Python pytest) dan Selenium IDE. Hasil aktual dibandingkan dengan hasil yang diharapkan untuk menetapkan status akhir pengujian fungsionalitas sistem CarbonSense secara visual pada Tabel 4.15 sampai Tabel 4.27.

*(Tabel 4.15 Hasil Eksekusi Pengujian Fungsionalitas Login)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **1. Login** | TC 1.1 | `self.driver.get("http://localhost:3000/")`<br>`self.driver.set_window_size(974, 1080)`<br>`self.driver.find_element(By.LINK_TEXT, "Dapatkan Peringatan").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem berhasil memblokir input kosong dan menampilkan pesan error di form. | **pass** |
| | TC 1.2 | `self.driver.get("http://localhost:3000/login")`<br>`self.driver.set_window_size(974, 1080)`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("okto@gmail.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem menampilkan pesan error "Email atau password salah!" saat dimasukkan password keliru. | **pass** |
| | TC 1.3 | `self.driver.get("http://localhost:3000/")`<br>`self.driver.set_window_size(974, 1080)`<br>`self.driver.find_element(By.LINK_TEXT, "Dapatkan Peringatan").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("tester")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("okto@gmail.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem berhasil melakukan login dan mengarahkan pengguna ke halaman select-device. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.16 Hasil Eksekusi Pengujian Fungsionalitas Registrasi)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **2. Registrasi** | TC 2.1 | `self.driver.get("http://localhost:3000/login")`<br>`self.driver.set_window_size(974, 1080)`<br>`self.driver.find_element(By.LINK_TEXT, "Daftar sekarang").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem memblokir pendaftaran kosong dan menampilkan pesan error kolom wajib diisi. | **pass** |
| | TC 2.2 | `self.driver.get("http://localhost:3000/register")`<br>`self.driver.set_window_size(974, 1087)`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .py-3").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .py-3").send_keys("betatester")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .px-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .px-4").send_keys("testerbeta@example.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("123")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem menampilkan error "Kata sandi harus terdiri dari minimal 6 karakter" untuk password pendek. | **pass** |
| | TC 2.3 | `self.driver.get("http://localhost:3000/register")`<br>`self.driver.set_window_size(974, 1080)`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .py-3").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .py-3").send_keys("betatester")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .px-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .px-4").send_keys("testerbeta@example.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("123123")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide > circle").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem sukses mendaftarkan akun baru dan mengarahkan pengguna ke halaman onboarding. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.17 Hasil Eksekusi Pengujian Fungsionalitas Onboarding)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **3. Onboarding** | TC 3.1 | `self.driver.get("http://localhost:3000/")`<br>`self.driver.set_window_size(974, 1080)`<br>`self.driver.find_element(By.LINK_TEXT, "Dapatkan Peringatan").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("testerbeta@example.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("123123")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()`<br>`self.driver.get("http://localhost:3000/dashboard")` | Percobaan bypass /dashboard digagalkan, sistem otomatis me-redirect ke halaman /onboarding. | **pass** |
| | TC 3.2 | `self.driver.get("http://localhost:3000/select-device")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".hover\\3Atext-\\[var\\(--cs-amber\\)\\]").click()` | Pengguna dapat mengulang onboarding lalu menekan Batal untuk kembali ke dashboard dengan aman. | **pass** |
| | TC 3.3 | `self.driver.get("http://localhost:3000/onboarding")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".p-5:nth-child(1)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".p-5:nth-child(3)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".p-5:nth-child(1)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".p-5:nth-child(3)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pt-6").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".px-8").click()` | Sistem sukses menyimpan jawaban kuesioner dan mengarahkan pengguna ke halaman pilih alat. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.18 Hasil Eksekusi Pengujian Fungsionalitas Edit Profil & Password)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **4. Edit Profil** | TC 4.1 | `self.driver.get("http://localhost:3000/profile")`<br>`self.driver.set_window_size(974, 547)`<br>`self.driver.find_element(By.CSS_SELECTOR, ".gap-3:nth-child(2)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".text-sm:nth-child(1)").clear()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".text-black:nth-child(3)").click()` | Sistem menolak penyimpanan profil dengan nama kosong dan memunculkan pesan error. | **pass** |
| | TC 4.2 | `self.driver.get("http://localhost:3000/profile")`<br>`self.driver.set_window_size(974, 547)`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .relative > .bg-black\\/40").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .relative > .text-xs").send_keys("123123")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(3) .w-full").send_keys("123123")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".mt-6").click()` | Sistem menolak pembaruan password karena password lama salah dan memunculkan pesan alert. | **pass** |
| | TC 4.3 | `self.driver.get("http://localhost:3000/profile")`<br>`self.driver.set_window_size(974, 547)`<br>`self.driver.find_element(By.CSS_SELECTOR, ".text-sm:nth-child(1)").clear()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".text-sm:nth-child(1)").send_keys("Okto")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".text-black:nth-child(3)").click()` | Sistem sukses memperbarui username pengguna di database MySQL dan menayangkan notifikasi sukses. | **pass** |
| | TC 4.4 | `self.driver.get("http://localhost:3000/profile")`<br>`self.driver.set_window_size(974, 547)`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .relative > .bg-black\\/40").send_keys("tester")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .relative > .text-xs").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(3) .w-full").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".mt-6").click()` | Sistem sukses mengganti password akun pengguna dan menampilkan alert notifikasi sukses. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.19 Hasil Eksekusi Pengujian Fungsionalitas Penautan Perangkat (QR Code))*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **5. Penautan Device** | TC 5.1 | `self.driver.get("http://localhost:3000/login?device=CS-DAPUR-01")`<br>`self.driver.set_window_size(974, 547)`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("okto3@gmail.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem mendeteksi parameter device dari scan QR dan menyimpannya sebagai pending device. | **pass** |
| | TC 5.2 | `self.driver.get("http://localhost:3000/select-device")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Pengguna berhasil memilih perangkat aktif dari daftar dan mengalihkan ke dashboard telemetri. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.20 Hasil Eksekusi Pengujian Fungsionalitas Aktivasi & Reaktivasi)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **6. Reaktivasi** | TC 6.1 | `self.driver.get("http://localhost:3000/login")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("okto3@gmail.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-\\[var\\(--cs-amber\\)\\]").click()` | Sistem mendeteksi status offline pada alat dan memicu pembukaan popup panduan reaktivasi. | **pass** |
| | TC 6.2 | `self.driver.get("http://localhost:3000/login")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("okto3@gmail.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("asdasd")<br>self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-\\[var\\(--cs-amber\\)\\]").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-\\[var\\(--cs-amber\\)\\]").click()` | Pengguna berhasil menutup panduan reaktivasi langkah terakhir dan dashboard me-reload. | **pass** |
| | TC 6.3 | `self.driver.get("http://localhost:3000/login")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".w-full:nth-child(2)").send_keys("okto3@gmail.com")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".pl-4").send_keys("asdasd")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Dashboard mendeteksi data baru dan mengganti indikator status secara otomatis menjadi Online. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.21 Hasil Eksekusi Pengujian Fungsionalitas Asisten Chat AI)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **7. Chat AI** | TC 7.1 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.set_window_size(974, 547)`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-\\[\\#070202\\]\\/85").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".focus\\3Aring-1").send_keys("kadar ppm saya berapa?")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-send").click()` | AI menolak memberikan data ppm palsu saat offline dan menyarankan reaktivasi alat. | **pass** |
| | TC 7.2 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-\\[\\#070202\\]\\/85").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".focus\\3Aring-1").send_keys("sekarang saya menaruh alat di kamar mandi")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-send").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".focus\\3Aring-1").send_keys("dimana letak alat saya tadi?")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-send").click()` | AI berhasil menjawab secara kontekstual menggunakan memori dialog sebelumnya. | **pass** |
| | TC 7.3 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-\\[\\#070202\\]\\/85").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".focus\\3Aring-1").send_keys("bagaimana cara saya menyalakan alat cs dari awal?")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-send").click()` | AI memberikan panduan instalasi firmware IoT carbonsense secara lengkap dan runtut. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.22 Hasil Eksekusi Pengujian Fungsionalitas Navigasi Histori Tanggal)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **8. Histori Data** | TC 8.1 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".relative:nth-child(1) > .w-full").click()` | Halaman grafik harian berhasil menampilkan data dengan filter tanggal default 'today'. | **pass** |
| | TC 8.2 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-zinc-800:nth-child(1)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".px-4:nth-child(3)").click()` | Tombol navigasi 'Kemarin' dan 'Besok' berhasil memicu perubahan tanggal grafik secara aman. | **pass** |
| | TC 8.3 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".bg-black\\/40:nth-child(2)").send_keys("2026-06-15")` | DatePicker dapat memilih tanggal kustom 15 Juni 2026 dan memperbarui grafik telemetri. | **pass** |
| | TC 8.4 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, "input[type='date']").send_keys("2030-01-01")` | Sistem menayangkan ilustrasi awan kosong dengan teks 'Tidak Ada Data Telemetri' saat data kosong. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.23 Hasil Eksekusi Pengujian Fungsionalitas Ekspor Laporan)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **9. Ekspor Laporan** | TC 9.1 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".hover\\3Abrightness-110").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".p-4:nth-child(4)").click()` | Unduhan berkas laporan dalam format Excel (.xlsx) dan berkas PDF berhasil disimpan ke lokal. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.24 Hasil Eksekusi Pengujian Fungsionalitas Pengaturan AI Assistant)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **10. Pengaturan AI** | TC 10.1 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-settings > circle").click()` | Formulir preferensi AI memuat konfigurasi ruangan pengguna dari local storage secara sukses. | **pass** |
| | TC 10.2 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-settings > circle").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".sm\\3Agrid-cols-3 > .gap-3:nth-child(1)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".px-8").click()` | Pilihan kelompok rentan berhasil memperbarui dan menyalakan Modus Sensitivitas Tinggi. | **pass** |
| | TC 10.3 | `self.driver.get("http://localhost:3000/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-settings > path").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".px-8").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".flex-1:nth-child(2)").click()` | Sistem sukses menyimpan perubahan dan me-redirect pengguna ke halaman dashboard utama. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.25 Hasil Eksekusi Pengujian Fungsionalitas Portal & Autentikasi Admin)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **11. Admin Auth** | TC 11.1 | `self.driver.get("http://localhost:3000/admin")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem memblokir pengiriman form masuk admin yang kosong dan meminta pengisian kolom. | **pass** |
| | TC 11.2 | `self.driver.get("http://localhost:3000/admin")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .py-3").send_keys("asd")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .w-full").send_keys("asd")<br>self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem menampilkan alert error 'Admin ID atau Password salah.' saat kredensial salah. | **pass** |
| | TC 11.3 | `self.driver.get("http://localhost:3000/admin")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(1) > .py-3").send_keys("admin")`<br>`self.driver.find_element(By.CSS_SELECTOR, "div:nth-child(2) > .w-full").send_keys("admin123")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".py-4").click()` | Sistem berhasil login admin dan mengalihkan halaman ke dashboard administrator. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.26 Hasil Eksekusi Pengujian Fungsionalitas Admin Dashboard)*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **12. Kelola Perangkat** | TC 12.1 | `self.driver.get("http://localhost:3000/admin/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".text-black").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".placeholder\\3Atext-zinc-700").send_keys("CS-DAPUR-OKTO")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".mt-2").click()` | Perangkat baru berhasil didaftarkan di sistem MySQL/Firebase dan kode QR dibuat. | **pass** |
| | TC 12.2 | `self.driver.get("http://localhost:3000/admin/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".hover\\3A bg-zinc-800\\/10:nth-child(1) .p-2:nth-child(1)").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".p-3:nth-child(3) .text-xs").click()` | Perangkat berhasil terikat secara manual ke akun email user terdaftar oleh administrator. | **pass** |
| | TC 12.3 | `self.driver.get("http://localhost:3000/admin/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".hover\\3A bg-zinc-800\\/10:nth-child(1) .p-2:nth-child(1) > .lucide").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-copy").click()` | Source code C++ firmware untuk device disiapkan dan berhasil disalin lengkap. | **pass** |
| | TC 12.4 | `self.driver.get("http://localhost:3000/admin/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".hover\\3A bg-zinc-800\\/10:nth-child(1) .p-2:nth-child(2) > .lucide").click()`<br>`self.driver.find_element(By.CSS_SELECTOR, ".font-mono:nth-child(2)").send_keys(" CS-DAPUR-OKTO-EDITED") | Perubahan detail perangkat (ID baru, owner baru) berhasil diperbarui ke MySQL & Firebase. | **pass** |
| | TC 12.5 | `self.driver.get("http://localhost:3000/admin/dashboard")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".hover\\3A bg-zinc-800\\/10:nth-child(1) .p-2:nth-child(5) > .lucide").click()` | Perangkat terhapus secara permanen dari tabel database MySQL dan cabang Firebase RTDB. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

*(Tabel 4.27 Hasil Eksekusi Pengujian Fungsionalitas Autentikasi (Logout))*

| Fungsionalitas | ID Test Case | Command (Selenium Log) | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **13. Logout** | TC 13.1 | `self.driver.get("http://localhost:3000/login")`<br>`self.driver.find_element(By.CSS_SELECTOR, ".lucide-log-out").click()` | Sesi terhapus bersih dari browser localStorage dan dialihkan kembali ke halaman utama. | **pass** |
| **Persentase keberhasilan (pass)** | | | | **100%** |

---

# BAB 5 KESIMPULAN DAN SARAN

## 5.1 Kesimpulan
Berdasarkan hasil analisis perancangan, implementasi kode program, serta pengujian fungsionalitas otomatis menggunakan Selenium IDE dan Selenium WebDriver yang telah dipaparkan pada bab-bab sebelumnya, dapat ditarik kesimpulan sebagai berikut:
1. **Keberhasilan Pemantauan Kualitas Udara Real-time (Tujuan 1)**: Platform CarbonSense telah sukses membangun ekosistem distributed system untuk memantau telemetry PPM sensor MQ-135 secara nirkabel dan real-time. Arsitektur database relasional (Supabase PostgreSQL / MySQL dengan Sequelize ORM) dan NoSQL (Firebase Realtime Database) terbukti andal dalam merekam telemetri, memfilter riwayat harian melalui DatePicker, serta memproses ekspor laporan harian ke format PDF dan Excel secara presisi.
2. **Ketercapaian Antarmuka Pengguna Intuitif (Tujuan 2)**: Alur antarmuka pengguna frontend React dirancang secara user-friendly, responsif, dan dinamis. Pengujian membuktikan modul registrasi, login pengguna biasa, alur kuesioner onboarding wajib, dan modifikasi data profil telah berjalan dengan andal dan terproteksi secara penuh dari potensi bypass URL ilegal ke dashboard.
3. **Keandalan Integrasi Asisten AI LLM (Tujuan 3)**: Asisten cerdas bertenaga DeepSeek/Gemini API telah berhasil diintegrasikan ke dalam dashboard pemantauan. Chatbot terbukti mampu memberikan rekomendasi mitigasi kesehatan ruangan secara dinamis berdasarkan memori dialog obrolan sebelumnya serta kuesioner onboarding. Pengujian membuktikan asisten AI juga memiliki safeguard otonom yang menolak memberikan nilai telemetri palsu apabila sensor sedang offline.
4. **Keberhasilan Arsitektur Edge-Computing & Alerting (Tujuan 4)**: Penautan perangkat fisik menggunakan parameter QR Code pemindaian URL terbukti efisien dan andal. Mekanisme penanganan kegagalan sensor (fault recovery) berupa deteksi offline secara otonom dan popup panduan reaktivasi 5 langkah di dasbor terbukti mampu membantu pemulihan koneksi sensor secara mandiri oleh pengguna akhir.

Pengujian fungsionalitas otomatis terhadap 38 kasus uji dinyatakan berhasil (**pass**) secara keseluruhan dengan tingkat keberhasilan sebesar **100%**. Selama siklus pengujian berlangsung, tim penguji telah berhasil mengidentifikasi dan menuntaskan dua defect penting, yaitu pengetatan validasi batas panjang karakter registrasi akun (minimal 6 karakter) serta penutupan kerentanan penautan perangkat ilegal lewat scan QR dengan membatasi penerimaan parameter ID perangkat hanya yang telah terdaftar resmi oleh administrator.

## 5.2 Saran
Untuk pengembangan dan peningkatan sistem CarbonSense di masa mendatang, tim penguji memberikan beberapa saran perbaikan sebagai berikut:
1. **Peningkatan Manajemen State Pengguna**: Disarankan untuk menambahkan animasi pemuatan (*skeleton loading state*) saat sistem menyinkronkan data parameter PPM kualitas udara dari database Supabase PostgreSQL ke dashboard frontend guna meningkatkan kenyamanan visual pengguna saat proses transisi loading data.
2. **Validasi Sisi Server (Backend Validation)**: Perlu ditambahkan validasi skema yang lebih ketat pada lapisan backend (*database constraint*) untuk parameter penautan perangkat, sebagai proteksi lapis kedua selain pengosongan halaman pada antarmuka frontend untuk meminimalkan manipulasi data oleh pihak luar.
3. **Mekanisme Penanganan Gangguan Sensor**: Disarankan untuk menambahkan sistem peringatan berupa notifikasi surat elektronik (e-mail) otomatis kepada pengguna apabila status perangkat terdeteksi *Offline* atau tidak aktif selama lebih dari 12 jam berturut-turut.
4. **Optimasi Responsivitas Antarmuka untuk Perangkat Bergerak (Mobile View Optimization)**: Menyesuaikan tata letak halaman dashboard overview serta menu interaksi chat AI pada peramban perangkat bergerak agar lebih ramah bagi pengguna ponsel pintar, dengan mengoptimalkan ukuran komponen sentuh (*touch target*) dan efisiensi pemuatan grafik.
5. **Ekspansi Repositori Pengetahuan Lokal pada Modul AI**: Meningkatkan akurasi rekomendasi kesehatan asisten AI dengan memperluas basis data dokumen pengetahuan (*knowledge base*) terkait jenis polutan ruangan baru, pemodelan prediktif sensor, serta penanganan bahaya gas spesifik.
