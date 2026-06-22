# 1 Perencanaan Pengujian

Bab 1 laporan pengujian perangkat lunak ini akan menjelaskan secara rinci tahapan perencanaan pengujian yang dilakukan oleh tim penguji pada proyek **CarbonSense** (Sistem Pemantauan Kualitas Udara Berbasis IoT). Pada bab ini, tim penguji akan menyusun dan menyiapkan *Software Under Test* (SUT) serta perangkat lunak pendukung yang diperlukan untuk menjalankan eksekusi *test case* secara otomatis. Langkah-langkah instalasi sistem dan alat-alat pengujian akan dijabarkan secara lengkap, termasuk persiapan lingkungan pengujian dan konfigurasi yang dibutuhkan. Selain itu, cakupan pengujian yang mencakup fungsionalitas yang akan diuji, teknik pengujian yang digunakan, serta penjadwalan pelaksanaan pengujian akan menjelaskan secara komprehensif. Dengan demikian, bab ini memberikan fondasi yang kuat untuk memastikan bahwa seluruh proses pengujian berjalan sesuai rencana dan dapat menghasilkan evaluasi yang akurat dan terpercaya terhadap sistem CarbonSense yang diuji.

## 1.1 Instalasi Sistem

Dalam proses instalasi sistem aplikasi CarbonSense, penting bagi tim penguji untuk menetapkan dan menjelaskan kebutuhan minimum yang diperlukan untuk menjalankan sistem secara optimal. Sub bab ini akan menguraikan persyaratan perangkat lunak dan perangkat keras yang harus disediakan, memastikan bahwa semua komponen sistem dapat berfungsi dengan baik dan mendukung setiap fungsionalitas yang ditawarkan. Selain itu, sub bab ini juga akan memberikan panduan langkah demi langkah untuk proses instalasi sistem, mencakup persiapan lingkungan, instalasi komponen utama, serta konfigurasi awal yang diperlukan. Dengan mengikuti panduan ini, diharapkan proses instalasi dapat dilakukan dengan lancar dan sistem dapat berjalan sesuai dengan yang diharapkan.

### 1.1.1 System Requirements

#### Tabel 1-1 Kebutuhan Perangkat Keras
| Perangkat Keras | Spesifikasi Minimal |
| :--- | :--- |
| **Processor** | Intel Core i5 / AMD Ryzen 5 (atau setara, clock speed >= 2.0 GHz) |
| **RAM** | 8 GB |
| **Storage** | SSD 256 GB (sisa ruang kosong minimal 10 GB) |
| **Perangkat IoT (SUT pendukung)** | Mikrokontroler ESP32 & Sensor Analog Kualitas Udara MQ135 (Simulasi/Fisik) |

#### Tabel 1-2 Kebutuhan Perangkat Lunak
| Perangkat Lunak | Spesifikasi Minimal |
| :--- | :--- |
| **Sistem Operasi** | Windows 10/11 / macOS / Linux (64-bit) |
| **Runtime Environment** | Node.js (v18.x atau lebih tinggi) |
| **Package Manager** | npm (v9.x atau lebih tinggi) |
| **DBMS** | Supabase PostgreSQL Cloud Database |
| **Framework Frontend** | React v19 & TypeScript (menggunakan build tool Vite) |
| **Framework Backend** | Express.js (Node.js) dengan Sequelize ORM |
| **Web Browser** | Microsoft Edge (versi terbaru) untuk eksekusi Selenium |
| **Database Real-time** | Firebase Realtime Database (untuk sinkronisasi parameter sensor IoT) |

### 1.1.2 System Deployment

Pada sub bab ini, tim penguji perangkat lunak akan menjelaskan tahapan-tahapan yang dilakukan untuk melakukan instalasi dan penyebaran (*deployment*) sistem CarbonSense menggunakan database cloud **Supabase**. Penjelasan ini mencakup langkah-langkah detail yang harus diikuti, mulai dari persiapan awal, pembuatan database di Supabase, hingga konfigurasi akhir lingkungan pengujian lokal (*local development*).

```
+-------------------------------------------------+
| 1. Mengunduh Source Code Aplikasi CarbonSense    |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
| 2. Menginstal Dependensi Node.js                |
|    (npm install pada Root & Server)             |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
| 3. Membuat Proyek Baru di Supabase Dashboard    |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
| 4. Mengambil Kredensial Connection Pooler & API |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
| 5. Mengonfigurasi Berkas .env pada Server       |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
| 6. Menjalankan Program & Migrasi Database       |
+-------------------------------------------------+
```
<div align="center"><b>Gambar 1-1 Langkah-Langkah Instalasi Sistem</b></div>

#### Langkah-Langkah Deployment Sistem:

1. **Mengunduh Source Code Aplikasi CarbonSense**
   Unduh source code proyek CarbonSense dari repositori Git proyek atau ekstrak file zip yang disediakan ke dalam direktori lokal komputer Anda, misalnya di folder `C:\projects\magicpath-project`.
   
   *(Tempatkan Gambar 1-2: Mengunduh Source Code dari Repositori Git di sini)*
   <div align="center"><b>Gambar 1-2 Mengunduh Source Code</b></div>

2. **Menginstal Dependensi Sistem Node.js**
   Setelah berkas proyek berada pada direktori lokal, buka aplikasi terminal (Command Prompt atau PowerShell), lalu masuk ke direktori root proyek dan jalankan perintah penginstalan paket dependensi frontend:
   `npm install`
   Setelah itu, buka sub-direktori backend (`server`), lalu jalankan instalasi modul backend Express:
   `cd server`
   `npm install`
   
   *(Tempatkan Gambar 1-3: Menginstal Dependensi Modul via Terminal di sini)*
   <div align="center"><b>Gambar 1-3 Menginstal Dependensi Node.js</b></div>

3. **Membuat Proyek Baru di Supabase Cloud Dashboard**
   Akses situs resmi Supabase di [https://supabase.com](https://supabase.com) dan masuk menggunakan akun GitHub atau akun email terdaftar Anda.
   
   *(Tempatkan Gambar 1-4: Masuk ke Dashboard Supabase di sini)*
   <div align="center"><b>Gambar 1-4 Dashboard Supabase</b></div>
   
   Di dashboard utama, klik tombol **"New Project"**, lalu pilih organisasi Anda. Lengkapi formulir pembuatan proyek baru dengan mengisi nama proyek (misalnya `CarbonSense-Database`), tentukan kata sandi database Anda (*Database Password*), pilih wilayah server terdekat (misalnya *Singapore* untuk kawasan Asia Tenggara), lalu klik **"Create new project"**.
   
   *(Tempatkan Gambar 1-5: Formulir Pembuatan Proyek Baru Supabase di sini)*
   <div align="center"><b>Gambar 1-5 Membuat Proyek Baru</b></div>

4. **Mengambil Kredensial Database dan API Supabase**
   Setelah proyek Supabase selesai dibuat, ambil kredensial koneksi PostgreSQL.
   - Masuk ke menu **Settings** (ikon gerigi di bilah navigasi kiri) -> pilih menu **Database**. gulir ke bawah ke bagian **Connection Pooler**. Pastikan mode pooler disetel ke *Transaction*, lalu salin string koneksi URI PostgreSQL yang disediakan.
   
   *(Tempatkan Gambar 1-6: Menyalin Connection String PostgreSQL di sini)*
   <div align="center"><b>Gambar 1-6 Menyalin Connection String</b></div>
   
   - Masuk ke menu **Settings** -> pilih menu **API**. Salin nilai **Project URL** dan **Project API Keys (anon public)** yang akan digunakan untuk koneksi otentikasi Supabase.
   
   *(Tempatkan Gambar 1-7: Menyalin Project URL dan Anon Key di sini)*
   <div align="center"><b>Gambar 1-7 Menyalin API URL dan Anon Key</b></div>

5. **Mengonfigurasi Environment Variables di Berkas `.env`**
   Buka editor kode Anda, lalu buat berkas baru bernama `.env` di dalam sub-direktori backend (`server/`). Tuliskan kredensial database Supabase yang telah disalin sebelumnya sebagai berikut:
   ```env
   PORT=5000
   JWT_SECRET=carbonsense-secret-key
   DATABASE_URL=postgresql://postgres.tobdzuwgssalzukacnea:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   VITE_SUPABASE_URL=https://tobdzuwgssalzukacnea.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *Catatan: Ganti token `[PASSWORD]` dengan kata sandi database Supabase yang Anda buat saat langkah ke-3.*
   
   *(Tempatkan Gambar 1-8: Konfigurasi Variabel Lingkungan di Berkas .env di sini)*
   <div align="center"><b>Gambar 1-8 Konfigurasi Berkas .env</b></div>

6. **Menjalankan Program dan Eksekusi Migrasi Database**
   Kembali ke root direktori proyek (`C:\projects\magicpath-project`) pada terminal, lalu jalankan perintah perintah concurrently berikut untuk mengaktifkan frontend dan backend secara bersamaan:
   `npm run dev`
   Saat server backend Express pertama kali dijalankan, ORM Sequelize secara otomatis akan mendeteksi status database di Supabase Cloud, terhubung dengan aman, dan melakukan inisialisasi (*auto-migration*) dengan membuat seluruh tabel model seperti `users` dan `devices` secara otomatis di Supabase.
   
   *(Tempatkan Gambar 1-9: Laporan Log Terminal Sukses Terhubung ke Database di sini)*
   <div align="center"><b>Gambar 1-9 Inisialisasi Database Sukses</b></div>

7. **Verifikasi Aplikasi pada Browser**
   Buka peramban Microsoft Edge dan akses URL `http://localhost:3000`. Coba gunakan fitur registrasi dan login. Apabila Anda berhasil diarahkan ke dashboard utama setelah pendaftaran akun, maka aplikasi CarbonSense dan database Supabase telah berjalan dengan sempurna.
   
   *(Tempatkan Gambar 1-10: Halaman Utama Aplikasi CarbonSense yang Berhasil Dimuat di sini)*
   <div align="center"><b>Gambar 1-10 Aplikasi Berhasil Dijalankan</b></div>

---

## 1.2 Instalasi Tools Pengujian

Tools pengujian utama yang digunakan oleh tim penguji adalah **Selenium IDE**. Selenium IDE (*Integrated Development Environment*) adalah alat pengujian otomatis berbasis peramban (*browser extension*) yang sederhana, cepat, dan mudah digunakan untuk merekam aktivitas interaksi pada aplikasi web. Di samping itu, untuk pengujian berbasis kode yang lebih fleksibel, tim penguji juga menggunakan **Selenium WebDriver (Python + pytest)**.

Berikut adalah langkah-langkah detail penginstalan dan penggunaan tools pengujian:

### 1.2.1 Pengujian dengan Selenium IDE

#### 1. Mengunduh Selenium IDE
- Buka browser Microsoft Edge atau Mozilla Firefox di komputer Anda.
- Kunjungi halaman unduhan resmi ekstensi Selenium IDE di **Edge Add-ons Store** (untuk Microsoft Edge) atau **Mozilla Add-ons** (untuk Firefox).

*(Tempatkan Gambar 1-11: Halaman Selenium IDE di Toko Ekstensi Browser di sini)*
<div align="center"><b>Gambar 1-11 Mengunduh Selenium IDE</b></div>

#### 2. Menambahkan Ekstensi ke Browser
- Klik tombol **"Dapatkan" (Get)** pada peramban Microsoft Edge (atau tombol **"Add to Firefox"** untuk Firefox).
- Konfirmasi pemasangan dengan mengklik tombol **"Add Extension"** atau **"Add"** pada jendela pop-up konfirmasi yang muncul.

*(Tempatkan Gambar 1-12: Pop-up Konfirmasi Penambahan Ekstensi ke Browser di sini)*
<div align="center"><b>Gambar 1-12 Menambahkan Ekstensi ke Browser</b></div>

#### 3. Mengakses Selenium IDE
- Setelah proses pemasangan ekstensi berhasil diselesaikan, ikon berlogo Selenium IDE akan muncul di bilah alat (*toolbar*) bagian kanan atas peramban.
- Klik ikon tersebut untuk meluncurkan jendela aplikasi Selenium IDE.

*(Tempatkan Gambar 1-13: Ikon Selenium IDE pada Toolbar Browser di sini)*
<div align="center"><b>Gambar 1-13 Mengakses Selenium IDE</b></div>

#### 4. Merekam Tes (Recording Test)
- Pada jendela utama Selenium IDE yang baru terbuka, pilih opsi **"Record a new test in a new project"** (atau *"Create a new project"* jika ingin membuat proyek kosong).
- Berikan nama untuk proyek pengujian Anda (contohnya: `CarbonSense Testing`), lalu klik **OK**.

*(Tempatkan Gambar 1-14: Jendela Pembuatan Proyek Baru di Selenium IDE di sini)*
<div align="center"><b>Gambar 1-14 Membuat Proyek Baru</b></div>

- Masukkan URL dasar dari aplikasi web (*Software Under Test*) yang ingin Anda uji, yaitu: `http://localhost:3000/`.
- Klik tombol **"Start Recording"** untuk memulai sesi perekaman.

*(Tempatkan Gambar 1-15: Pengisian URL Target Pengujian di Selenium IDE di sini)*
<div align="center"><b>Gambar 1-15 Mengisi URL Target dan Mulai Merekam</b></div>

- Selenium IDE secara otomatis akan membuka jendela penjelajah baru Microsoft Edge yang memuat halaman web tersebut, dan merekam semua interaksi fisik yang Anda lakukan (klik tombol, pengisian formulir, pemilihan menu, navigasi halaman) ke dalam skrip uji.

#### 5. Menjalankan Tes (Running Test)
- Setelah selesai merekam seluruh skenario uji fungsionalitas, kembali ke jendela Selenium IDE dan klik tombol merah **"Stop Recording"** di pojok kanan atas.
- Berikan nama untuk *test case* yang telah selesai direkam (misalnya: `TC 1.3 - Login Success`), lalu klik **OK**. Hasil rekaman akan ditampilkan dalam bentuk daftar langkah-langkah (*steps*) berupa perintah, target, dan nilai (*Command, Target, Value*).
- Untuk menjalankan ulang tes otomatis yang telah terekam, klik tombol **"Play Current Test Case"** (ikon segitiga) pada bilah menu.

*(Tempatkan Gambar 1-16: Antarmuka Langkah Uji dan Tombol Play di Selenium IDE di sini)*
<div align="center"><b>Gambar 1-16 Menjalankan Kasus Uji Otomatis</b></div>

#### 6. Menyimpan dan Mengelola Proyek Tes
- Agar hasil rekaman skenario pengujian dapat digunakan kembali di kemudian hari, simpan proyek pengujian dengan memilih menu **File** -> klik **Save Project** (atau tekan pintasan tombol **Ctrl + S**).
- Simpan file proyek tersebut dengan nama berkas berekstensi `.side` (contohnya: `CarbonSense Testing.side`).
- Tim penguji dapat mengelola kasus uji dengan mengedit target xpath, mengubah data input (value), menambahkan langkah asersi (*assertions* seperti `assert text` atau `verify title`), serta mengelompokkan *test case* ke dalam *test suite* yang terstruktur.

*(Tempatkan Gambar 1-17: Menu Menyimpan Proyek Pengujian Selenium IDE di sini)*
<div align="center"><b>Gambar 1-17 Menyimpan Proyek Pengujian</b></div>

Dengan menggunakan Selenium IDE, tim penguji dapat dengan cepat merekam, memverifikasi, dan menjalankan pengujian fungsionalitas secara visual serta memudahkan dalam manajemen kasus uji.

---

### 1.2.2 Pengujian dengan Selenium WebDriver (Python + pytest)

Selain perekaman visual menggunakan Selenium IDE, tim penguji juga mengonfigurasi skrip pengujian berbasis kode untuk memfasilitasi integrasi pengujian terautomasi yang lebih kompleks:

1. **Instalasi Python dan Library Pendukung**
   Unduh dan pasang Python (minimal v3.8) dari situs resmi [python.org](https://www.python.org/). Jalankan perintah berikut pada terminal proyek untuk memasang library Selenium WebDriver dan framework pengujian pytest:
   `pip install selenium pytest`
2. **Penginstalan WebDriver Edge**
   Pastikan berkas penggerak **Edge WebDriver** (`msedgedriver.exe`) yang versinya cocok dengan browser Microsoft Edge Anda telah diunduh dan diposisikan dalam direktori *environment PATH* sistem.
3. **Eksekusi Pengujian Otomatis Massal**
   Jalankan file skrip pengujian berbasis pytest dengan mengetikkan perintah berikut pada terminal direktori root proyek:
   `pytest test_suite_selenium.py`
   Kerangka pytest akan menjalankan seluruh 38 skenario uji otomatis di latar belakang secara berurutan dan mengeluarkan visualisasi laporan log pengujian berbentuk HTML.

---

## 1.3 Cakupan Pengujian

Dalam upaya untuk memastikan kualitas dan keandalan sistem aplikasi CarbonSense, tim penguji perlu secara sistematis menentukan cakupan proses pengujian. Pada sub bab ini, tim penguji akan menjelaskan secara terperinci fungsionalitas-fungsionalitas utama yang akan diuji, teknik pengujian yang diterapkan, serta jadwal pelaksanaan pengujian yang dirancang. Dengan demikian, sub bab ini memberikan gambaran menyeluruh mengenai pendekatan pengujian yang digunakan, memastikan bahwa setiap aspek penting dari sistem diuji secara komprehensif dan efisien. Pendekatan ini bertujuan untuk mengidentifikasi dan memperbaiki potensi masalah sebelum sistem diimplementasikan secara penuh, sehingga memberikan jaminan kualitas yang tinggi kepada pengguna akhir.

### 1.3.1 Fungsionalitas Sistem

Dalam sistem aplikasi CarbonSense ini, berbagai fungsionalitas dirancang untuk memastikan pengalaman pengguna dalam memantau kualitas udara menjadi komprehensif dan efisien. Setiap fungsionalitas memiliki peran khusus dalam mendukung operasional sistem dan melayani kebutuhan pengguna. Berikut ini adalah deskripsi singkat mengenai **13 fungsionalitas utama** yang ada dalam sistem CarbonSense yang dicakup dalam ruang lingkup pengujian perangkat lunak:

#### a. Fungsionalitas Autentikasi (Login) Pengguna
Fungsionalitas login digunakan untuk memverifikasi (autentikasi) identitas pengguna agar dapat masuk ke dalam sistem. Pengguna diharuskan mengisikan email dan password terdaftar. Sistem akan membandingkan data masukan dengan data terenkripsi di database PostgreSQL Supabase. Jika email dan password cocok (TRUE), pengguna diarahkan masuk ke aplikasi. Jika kosong atau salah (FALSE), sistem menolak akses dan memunculkan pesan alert/peringatan error.

#### b. Fungsionalitas Registrasi Akun Baru
Fungsionalitas registrasi digunakan untuk mendaftarkan akun pengguna baru ke dalam database sistem. Pendaftar harus mengisi nama lengkap, email, dan kata sandi. Terdapat batas minimum panjang password (minimal 6 karakter) serta validasi keunikan email. Jika masukan memenuhi syarat dan email belum terdaftar (TRUE), akun baru berhasil disimpan ke database. Jika masukan kosong, format email salah, atau password kurang dari 6 karakter (FALSE), registrasi gagal dan sistem menampilkan pesan validasi.

#### c. Fungsionalitas Pengisian Onboarding (Kuesioner Kesehatan)
Fungsionalitas ini merupakan halaman kuesioner wajib bagi pengguna baru segera setelah pendaftaran akun berhasil. Kuesioner ini menanyakan kondisi kesehatan paru-paru, sensitivitas pernapasan, dan adanya anggota keluarga rentan di rumah. Jawaban disimpan ke database (TRUE) untuk menyetel parameter awal rekomendasi udara. Pengguna tidak diperbolehkan melewati halaman ini secara paksa sebelum mengirim jawaban (FALSE).

#### d. Fungsionalitas Manajemen Profil Pengguna (Edit Profil)
Fungsionalitas ini memungkinkan pengguna yang telah masuk untuk memperbarui informasi profil mereka seperti nama lengkap, email, dan kata sandi baru. Sistem akan memeriksa keabsahan data input dan kecocokan password. Jika valid (TRUE), perubahan disimpan ke database dan memunculkan alert sukses. Jika data kosong (FALSE), sistem menampilkan pesan kegagalan.

#### e. Fungsionalitas Penautan Perangkat (QR Code Binding)
Fungsionalitas ini memfasilitasi pengguna untuk menghubungkan perangkat IoT fisik CarbonSense dengan akun mereka secara mandiri. Penautan dilakukan dengan memindai kode QR perangkat yang menghasilkan parameter URL `login?device=...`. Halaman ini dirancang secara khusus untuk alur penautan perangkat (bukan login biasa). Sistem memverifikasi apakah kode perangkat terdaftar di database admin. Jika terdaftar (TRUE), perangkat berhasil ditautkan. Jika parameter URL berada di luar daftar perangkat resmi admin (FALSE), halaman akan dikosongkan untuk mencegah peretasan penautan.

#### f. Fungsionalitas Aktivasi dan Reaktivasi Perangkat
Fungsionalitas ini mendeteksi status keaktifan perangkat sensor pemantau udara. Perangkat yang aktif akan mengirimkan data parameter kualitas udara secara berkala (Online). Apabila sensor terdeteksi mati atau mengalami kendala jaringan (Offline), pengguna dapat menekan tombol reaktivasi. Sistem akan melakukan ping koneksi (TRUE) untuk mengembalikan status perangkat menjadi Online. Jika koneksi gagal (FALSE), status tetap Offline.

#### g. Fungsionalitas Konsultasi Asisten Chat AI
Fungsionalitas asisten kesehatan berbasis kecerdasan buatan (Gemini API) yang tersemat pada dashboard pengguna. Fitur ini membaca metrik PPM kualitas udara real-time saat ini untuk merumuskan jawaban anjuran kesehatan jika pengguna bertanya di kolom chat. Apabila respons AI berhasil diperoleh (TRUE), percakapan ditampilkan. Jika terkendala masalah jaringan (FALSE), obrolan ditutup dengan pemberitahuan kesalahan.

#### h. Fungsionalitas Navigasi Histori Tanggal (DatePicker & Button Nav)
Fungsionalitas ini memungkinkan pengguna memantau riwayat kualitas udara pada masa lampau. Pengguna dapat memilih tanggal tertentu via pemilih tanggal (*DatePicker*) atau tombol "Kemarin" dan "Besok". Sistem akan mengambil data log sensor harian dari database sesuai tanggal pilihan. Jika data log sensor pada tanggal tersebut ada (TRUE), grafik tren PPM (menggunakan Recharts) diperbarui. Jika data kosong/tidak ditemukan (FALSE), grafik akan menampilkan keterangan data nihil.

#### i. Fungsionalitas Ekspor Laporan
Fungsionalitas ini memungkinkan pengguna untuk mengekspor dan mengunduh data telemetri kualitas udara historis dari dashboard. Pengguna dapat memilih mengunduh dalam format Excel (`.xlsx`) atau format dokumen ringkasan (`.pdf`). Sistem memproses data sensor yang terpilih (TRUE) untuk digenerasi menjadi file unduhan fisik pada komputer lokal. Jika terjadi kesalahan pembacaan data (FALSE), sistem membatalkan proses ekspor dengan pesan kesalahan.

#### j. Fungsionalitas Pengaturan AI Assistant (Mode Sensitivitas Tinggi)
Fungsionalitas untuk menyetel mode perlindungan udara berdasarkan kerentanan anggota keluarga (seperti kategori Bayi/Balita, Lansia, atau Penderita Asma) pada menu pengaturan. Ketika salah satu kelompok rentan dipilih, sistem akan mengaktifkan "Modus Sensitivitas Tinggi". Jika pengaturan disimpan (TRUE), batas threshold peringatan PPM diturunkan (menjadi lebih protektif) dan rekomendasi kesehatan dari AI disesuaikan. Jika diabaikan (FALSE), setelan kembali ke batas normal.

#### k. Fungsionalitas Portal dan Autentikasi Admin
Fungsionalitas khusus yang membatasi akses ke menu administrasi sistem. Pengguna admin harus memasukkan username dan password administrator yang sah pada halaman `/admin`. Autentikasi diverifikasi oleh database backend (TRUE) untuk membuka menu admin dashboard. Jika kredensial admin tidak tepat (FALSE), akses ditolak secara ketat.

#### l. Fungsionalitas Admin Dashboard (Pendaftaran & Generate QR Code Alat)
Fungsionalitas khusus admin untuk meregistrasikan Device ID baru (misal `CS-DAPUR-01`) ke dalam database Supabase. Admin memasukkan kode unik alat baru ke form pendaftaran. Jika pendaftaran sukses (TRUE), sistem memunculkan pop-up modal sukses yang berisi visualisasi QR Code untuk dicetak dan ditempel pada perangkat fisik. Jika Device ID duplikat atau kosong (FALSE), sistem memblokir pendaftaran.

#### m. Fungsionalitas Autentikasi (Logout)
Fungsionalitas logout digunakan untuk mengakhiri sesi aktif pengguna atau admin secara aman. Ketika tombol logout ditekan, sistem akan menghapus seluruh data otentikasi lokal (*localStorage* seperti token sesi dan data kredensial aktif) secara bersih (TRUE) lalu mengalihkan pengguna kembali ke halaman utama login (`/login`). Jika token gagal dihapus atau terjadi kegagalan sistem (FALSE), sesi tetap aktif dan halaman tidak dialihkan.

### 1.3.2 Teknik Pengujian

Pendekatan yang digunakan untuk menyusun *test case* dan menentukan data pengujian dalam kegiatan ini adalah metode **Black Box Testing**, yang berfokus pada dua teknik utama: **Boundary Value Analysis (BVA)** dan **Equivalence Partitioning (EP)**. Black box testing adalah metode pengujian perangkat lunak yang memeriksa fungsi aplikasi tanpa melihat struktur internal atau kode sumbernya.

- **Boundary Value Analysis (BVA)**
  Teknik BVA diterapkan untuk mengidentifikasi nilai batas krusial pada masukan dan keluaran sistem yang rentan terhadap kesalahan (*bugs*). Dalam proyek ini, BVA diimplementasikan pada:
  1. **Panjang Kata Sandi (Password):** Menguji panjang input pada batas minimal 6 karakter. *Test case* dirancang menggunakan data masukan dengan panjang 5 karakter (kurang dari batas), tepat 6 karakter (pada batas), dan 7 karakter (di atas batas).
  2. **Nilai Threshold MQ135 PPM:** Menguji tingkat keakuratan respons sistem dan AI Assistant ketika metrik PPM sensor menyentuh titik kritis perpindahan status udara (misal batas aman 1000 PPM, menguji di 999 PPM, 1000 PPM, dan 1001 PPM).

- **Equivalence Partitioning (EP)**
  Teknik EP membagi sekumpulan data masukan ke dalam beberapa partisi kelas valid (*valid partition*) dan kelas tidak valid (*invalid partition*) untuk meminimalkan redundansi kasus uji. Dalam proyek ini, EP diterapkan pada:
  1. **Format Alamat Email:** Membagi input email menjadi kelas valid (memiliki pola `@` dan `.com` seperti `user@example.com`) dan kelas tidak valid (tanpa pola standard seperti `userexample.com` or `user@`).
  2. **Device ID QR Code:** Membagi parameter URL alat menjadi kelas terdaftar di database admin (penautan berhasil) dan kelas tidak terdaftar/asal-asalan (halaman penautan langsung dikosongkan).

### 1.3.3 Jadwal dan Pengawakan

Pembuatan rancangan (*test case*) dan pelaksanaan pengujian dijadwalkan secara sistematis dan melibatkan seluruh anggota tim penguji dengan pembagian tugas yang jelas. Hal ini bertujuan agar setiap fungsionalitas sistem CarbonSense dapat diuji secara mendalam dan menyeluruh. Detail jadwal dan pembagian peran pengujian dipaparkan pada Tabel 1-3.

#### Tabel 1-3 Jadwal dan Pengawakan Pengujian
| No. | Tanggal Pekerjaan | Deskripsi Pekerjaan | Penanggung Jawab |
| :--- | :--- | :--- | :--- |
| 1. | 17 – 20 Mei 2026 | Mempersiapkan repositori *source code* aplikasi CarbonSense yang akan diuji. | Ichwan Riskhi |
| 2. | 20 – 24 Mei 2026 | Melakukan *local deployment* sistem dan konfigurasi database Supabase PostgreSQL. | Gerrard Enriheart Darondo |
| 3. | 24 – 28 Mei 2026 | Membuat rancangan awal skenario kasus uji (*test cases*) untuk modul autentikasi (user & admin). | Faisya Cahyarani Pidieanti |
| 4. | 28 Mei – 2 Juni 2026 | Menyiapkan script skenario Selenium IDE (`.side`) dan skrip Selenium Python (`test_suite_selenium.py`). | Ichwan Riskhi |
| 5. | 2 – 5 Juni 2026 | Mengeksekusi seluruh 38 skenario uji otomatis di browser menggunakan Selenium IDE & Pytest. | Gerrard Enriheart Darondo |
| 6. | 5 – 7 Juni 2026 | Menganalisis log kesalahan (*bugs*) dan melakukan verifikasi penyesuaian fungsionalitas (seperti batasan registrasi & QR binding). | Faisya Cahyarani Pidieanti |
| 7. | 7 – 9 Juni 2026 | Menyusun Bab 1 (Perencanaan Pengujian) pada dokumen laporan pengujian perangkat lunak. | Ichwan Riskhi |
| 8. | 9 – 11 Juni 2026 | Menyusun Bab 2 (Perancangan Kasus Uji) dan Bab 3 (Hasil Eksekusi dan Analisis Log Pengujian). | Gerrard Enriheart Darondo |
| 9. | 11 – 13 Juni 2026 | Mengonversi dan merapikan log pengujian ke format dokumen cetak HTML tabel (`test_cases_export.html`). | Faisya Cahyarani Pidieanti |
| 10. | 13 – 15 Juni 2026 | Finalisasi penyusunan dokumen laporan pengujian, *formatting check*, dan penyerahan laporan. | Ichwan Riskhi |
