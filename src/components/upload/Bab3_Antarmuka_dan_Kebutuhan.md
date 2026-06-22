# Bab 3: Desain dan Kebutuhan Sistem (CarbonSense)

Berikut adalah draf rancangan dokumen untuk **Sub-bab 3.3 (Perancangan Antarmuka Pengguna)** dan **Sub-bab 3.4 (Kebutuhan Perangkat Keras dan Perangkat Lunak)** yang disesuaikan dengan arsitektur teknologi **CarbonSense** (React, Express, Supabase PostgreSQL, Firebase RTDB, Gemini API, dan ESP32 + MQ-135).

---

## 3.3 Perancangan Antarmuka Pengguna
Perancangan antarmuka pengguna (*User Interface* / UI) pada platform **CarbonSense** dikembangkan dengan berlandaskan pada pendekatan *Human-Centered Design* yang disesuaikan dengan segmentasi pengguna, mencakup pengguna umum (pemilik rumah/ruangan) dan administrator pengelola sistem registry. Desain ditekankan pada aspek kesederhanaan (*simplicity*), kejelasan informasi visual (*visual clarity*), responsivitas, dan kemudahan dalam penafsiran metrik gas PPM yang rumit menjadi instruksi yang memanusiakan data (*humanized information*).

Rancangan antarmuka sistem dibagi menjadi dua bagian utama:

### 1. Rancangan Antarmuka Web App Klien (User / Pengguna Terdaftar)
Antarmuka ini ditujukan bagi pengguna umum sebagai portal monitoring kualitas udara mandiri di ruangan mereka.
*   **Halaman Registrasi & Login**: Form pendaftaran akun baru (dengan validasi kata sandi minimal 6 karakter) serta portal otentikasi masuk pengguna terdaftar demi mengamankan hak akses sesi.
*   **Halaman Onboarding (Profil AI)**: Kuesioner mandatori interaktif untuk memetakan kondisi ruangan (ventilasi) dan keberadaan kelompok sensitif kesehatan (penderita asma, alergi, bayi/balita) guna menyesuaikan sensitivitas peringatan gas berbahaya secara otomatis.
*   **Halaman Select Device (Tautkan Perangkat)**: Antarmuka pemindaian kode QR atau penginputan Device ID secara manual untuk mendaftarkan dan mengaitkan hardware sensor IoT fisik ke akun pengguna.
*   **Halaman Dashboard Utama (Monitoring)**: Menyajikan widget tingkat PPM gas MQ-135 secara real-time yang tersinkronisasi via Firebase RTDB, grafik garis tren historis (Recharts) interaktif dengan filter tanggal (*DatePicker*), panel instan diagnostik jaringan (ping, status online/offline, timestamp `lastActive`), serta tombol ekspor laporan log kualitas udara (PDF/XLSX).
*   **Halaman Peringatan Bahaya AI & Mitigasi**: Banner alarm visual berwarna merah menyala ketika kadar gas melewati ambang batas aman (> 1000 PPM), yang disertai dengan rekomendasi penanganan kedaruratan hasil analisis Gemini AI.
*   **Halaman Settings (Pengaturan Sensitivitas AI)**: Halaman kontrol untuk memodifikasi ulang status kelompok rentan guna mengubah batas alarm protektif sensor.

### 2. Rancangan Antarmuka Web Admin Dashboard (Administrator)
Antarmuka khusus pengelola sistem untuk memantau peredaran hardware sensor di lapangan.
*   **Halaman Login Admin**: Portal khusus dengan tingkat otorisasi admin untuk masuk ke konsol konfigurasi sistem.
*   **Halaman Dashboard Manajemen Perangkat**: Berisi tabel database dinamis yang menampilkan daftar inventori seluruh alat IoT terdaftar di sistem, status koneksi aktual ('Online', 'Offline', 'Warning'), kadar PPM aktual, pencantuman email pemilik, serta dilengkapi bar pencarian kata kunci (*search bar*).
*   **Panel Kontrol Perangkat (CRUD & Code)**: Tombol-tombol aksi cepat untuk meregistrasikan ID alat baru (otomatis membuat visualisasi QR Code), mengubah email penautan, menghapus registrasi alat, serta tombol penyalinan source code C++ Arduino (.ino) untuk kemudahan perakitan perangkat keras baru.

---

## 3.4 Kebutuhan Perangkat Keras dan Perangkat Lunak
Untuk menjamin kelancaran pembuatan, pengujian, dan operasional platform **CarbonSense**, diperlukan spesifikasi perangkat keras (*hardware*) dan perangkat lunak (*software*) yang memadai. Kebutuhan ini diklasifikasikan ke dalam dua fase utama, yaitu fase pengembangan sistem (*development*) dan fase implementasi sistem di lapangan (*production/deployment*).

### 3.4.1 Pengembangan Sistem
Kebutuhan pengembangan sistem merujuk pada spesifikasi alat dan teknologi dasar yang digunakan oleh pengembang (*developer*) selama proses pengodingan, perakitan mikrokontroler, serta pelaksanaan pengujian fungsionalitas secara lokal maupun melalui otomasi pengujian (*automation testing*).

**Table 3.1 Kebutuhan Perangkat Keras Lingkungan Pengembangan (Development)**

| Kategori | Spesifikasi Minimum / Komponen yang Digunakan |
| :--- | :--- |
| Perangkat Komputasi | Laptop/PC dengan prosesor setara Intel Core i5 / AMD Ryzen 5 ke atas |
| Memori (RAM) | Minimal 8 GB |
| Penyimpanan | Minimal 256 GB SSD (Solid State Drive) |
| Komponen IoT (Purwarupa) | Development board ESP32, Sensor Kualitas Udara Gas MQ-135, Breadboard, Kabel Jumper (Male-to-Male/Male-to-Female), Kabel Data micro-USB, dan LED Indikator. |

<br>

**Table 3.2 Kebutuhan Perangkat Lunak Lingkungan Pengembangan (Development)**

| Kategori | Nama Perangkat Lunak / Teknologi |
| :--- | :--- |
| Sistem Operasi | Windows 10/11, macOS, atau Linux |
| Text Editor / IDE | Visual Studio Code (VS Code) dengan ekstensi ESLint dan Prettier |
| Web Server & Runtime | Node.js v18.x / v20.x runtime environment |
| Framework Backend | Express.js (Node.js framework) untuk perancangan REST API |
| Library Frontend | React + Vite (dengan TypeScript) untuk antar-muka pengguna |
| Database Relasional | Supabase PostgreSQL (Cloud Database) / MySQL Server untuk data persisten |
| Real-time Database | Firebase Realtime Database (RTDB) untuk streaming data sensor |
| IoT Environment | Arduino IDE (C++) dengan Board Manager ESP32 dan library Firebase-ESP-Client |
| AI API Provider | Gemini API (Google AI SDK) untuk generator anjuran keselamatan AI |
| API Tester | Postman untuk pengujian endpoint REST API |
| Testing Automation Tools | Selenium IDE (Edge Extension) & WebDriver, Python, serta library Selenium Python SDK |

---

### 3.4.2 Implementasi Sistem
Kebutuhan implementasi sistem merujuk pada spesifikasi infrastruktur perangkat keras fisik yang dipasang secara permanen di lokasi ruangan pengguna, serta spesifikasi server awan (*cloud hosting*) untuk menjaga sistem backend dan database tetap online selama 24 jam penuh.

**Table 3.3 Spesifikasi Perangkat Keras Implementasi Sistem di Lapangan**

| Kategori | Spesifikasi Komponen / Alat |
| :--- | :--- |
| Mikrokontroler Utama | ESP32 (dilengkapi modul Wi-Fi built-in 2.4 GHz) |
| Sensor Lingkungan | Sensor Gas MQ-135 (mendeteksi gas CO2, CO, asap, amonia, sulfat, benzena) |
| Catu Daya (Power Supply) | Adaptor DC 5V/1A micro-USB |
| Perangkat Akses Klien | Smartphone (Android/iOS) atau Laptop/PC dengan peramban web modern |

<br>

**Table 3.4 Spesifikasi Infrastruktur Perangkat Lunak dan Server (Production)**

| Kategori | Spesifikasi Infrastruktur Production |
| :--- | :--- |
| Web App Hosting (Frontend) | Vercel Serverless Hosting Platform (untuk web client React) |
| API Layer Hosting (Backend) | Render Hosting Service / VPS berbasis Linux (Ubuntu Server) dengan RAM minimal 2GB |
| Web Server | Nginx Engine (sebagai reverse proxy di VPS backend) |
| Runtime Environment | Node.js v18.x / v20.x runtime |
| Database Server | Supabase Managed Cloud PostgreSQL |
| Real-time Database Cloud | Firebase Realtime Database Service |
| Cloud AI Integration | Gemini API Cloud Service (production key) |
| Aplikasi Klien (User/Admin) | Peramban Web Modern (Microsoft Edge, Google Chrome, Safari, Firefox) |
