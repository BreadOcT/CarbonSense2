import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { User, Device, TelemetryLog } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'carbonsense-secret-key';

// Middlewares
app.use(cors());
app.use(express.json());

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Seed default devices if none exist
const seedDatabase = async () => {
  try {
    // Seed default devices if database is empty
    const deviceCount = await Device.count();
    if (deviceCount === 0) {
      await Device.bulkCreate([
        { id: 'CS-DAPUR-01', userEmail: 'budi@example.com', status: 'Online', ppm: '450', lastActive: 'Baru saja' },
        { id: 'CS-KAMAR-02', userEmail: 'siti@example.com', status: 'Online', ppm: '800', lastActive: '2 mnt lalu' },
        { id: 'CS-RUANG-03', userEmail: 'rahman@example.com', status: 'Offline', ppm: '0', lastActive: '5 jam lalu' },
        { id: 'CS-DAPUR-04', userEmail: 'warung@example.com', status: 'Warning', ppm: '1250', lastActive: 'Baru saja' },
      ]);
      console.log('Seeded initial mock devices for testing.');
    }
  } catch (err) {
    console.error('Seeding database failed:', err);
  }
};

// ==================== AUTH ROUTES ====================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Harap lengkapi semua bidang.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Gunakan email lain.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi harus terdiri dari minimal 6 karakter.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Registrasi berhasil.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat pendaftaran.' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Harap masukkan email dan password.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Email atau password salah.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login berhasil.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
});

// Admin Login (using ADMIN_ID and ADMIN_PASSWORD from .env)
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const envAdminId = process.env.ADMIN_ID ? process.env.ADMIN_ID.trim() : '';
    const envAdminPassword = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';

    if (!envAdminId || !envAdminPassword) {
      return res.status(500).json({ error: 'Konfigurasi admin pada server tidak lengkap.' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Harap masukkan Admin ID dan password.' });
    }

    // Verify against environment variables
    if (email.trim() !== envAdminId || password !== envAdminPassword) {
      return res.status(401).json({ error: 'Admin ID atau Password salah.' });
    }

    // Generate JWT token with admin role
    const token = generateToken({
      id: 0,
      email: envAdminId,
      role: 'admin'
    });

    res.json({
      message: 'Login Admin berhasil.',
      token,
      user: { id: 0, username: 'System Admin', email: envAdminId, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login admin.' });
  }
});

// Get Users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'username', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengguna.' });
  }
});


// ==================== DEVICE ROUTES ====================

// Get Devices (Admin sees all, users see their own via query filter or authorization)
app.get('/api/devices', async (req, res) => {
  try {
    const { email } = req.query;

    // Check and update offline status for devices that haven't sent data in 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    const now = new Date();

    const allDevices = await Device.findAll();
    for (const device of allDevices) {
      if (device.status !== 'Offline' && device.status !== 'Menunggu Bind') {
        const updatedAtTime = new Date(device.updatedAt).getTime();
        if (now.getTime() - updatedAtTime > fiveMinutes) {
          device.status = 'Offline';
          device.ppm = '--';
          device.lastActive = '5 menit yang lalu';
          await device.save();
        }
      }
    }

    let devices;
    if (email) {
      devices = await Device.findAll({ where: { userEmail: email }, order: [['createdAt', 'DESC']] });
    } else {
      devices = await Device.findAll({ order: [['createdAt', 'DESC']] });
    }

    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Gagal mengambil data perangkat.' });
  }
});

// Create Device (Admin only)
app.post('/api/devices', async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID perangkat tidak boleh kosong.' });
    }

    const existingDevice = await Device.findByPk(id);
    if (existingDevice) {
      return res.status(400).json({ error: 'Device ID sudah terdaftar.' });
    }

    const device = await Device.create({
      id,
      status: status || 'Offline',
      ppm: '--',
      lastActive: 'Belum Aktif'
    });

    res.status(201).json(device);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Gagal membuat perangkat baru.' });
  }
});

// Bind Device to User Email (Admin or user scanning QR)
app.post('/api/devices/bind', async (req, res) => {
  try {
    const { deviceId, userEmail } = req.body;

    if (!deviceId || !userEmail) {
      return res.status(400).json({ error: 'Device ID dan Email Pengguna wajib diisi.' });
    }

    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Perangkat tidak ditemukan.' });
    }

    // Set ownership and status
    device.userEmail = userEmail;
    device.status = 'Online';
    device.ppm = '0';
    device.lastActive = 'Baru saja';
    await device.save();

    // Sync to Firebase RTDB via REST API
    try {
      const dbUrl = "https://carbonsense-iot-default-rtdb.asia-southeast1.firebasedatabase.app";
      await fetch(`${dbUrl}/${deviceId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userEmail,
          status: 'Online',
          nilai_ppm: 0,
          lastActive: 'Baru saja'
        })
      });
      console.log(`Successfully synced bind for ${deviceId} to Firebase RTDB.`);
    } catch (fbErr) {
      console.error('Failed to sync bind to Firebase RTDB REST:', fbErr.message);
    }

    res.json({ message: 'Perangkat berhasil ditautkan.', device });
  } catch (error) {
    console.error('Bind device error:', error);
    res.status(500).json({ error: 'Gagal menautkan perangkat.' });
  }
});

// Telemetry Endpoint (e.g. for IoT devices or web simulation to push data)
app.post('/api/devices/telemetry', async (req, res) => {
  try {
    const { id, ppm, status, skipFirebaseSync } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Device ID wajib dikirim.' });
    }

    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({ error: 'Perangkat tidak terdaftar.' });
    }

    if (ppm !== undefined) {
      device.ppm = String(ppm);
      // If the device is currently Offline and a new PPM comes in, bring it online automatically
      if (device.status === 'Offline' && status !== 'Offline') {
        device.status = Number(ppm) > 1200 ? 'Warning' : 'Online';
      }
    }
    if (status !== undefined) device.status = status;
    device.lastActive = 'Baru saja';

    await device.save();

    // Persist historical PPM reading to the database (TelemetryLog table)
    const numericPpm = ppm !== undefined && ppm !== '--' ? Number(ppm) : NaN;
    if (!isNaN(numericPpm) && status !== 'Offline') {
      try {
        const nowTs = Date.now();
        const lastLog = await TelemetryLog.findOne({
          where: { deviceId: id },
          order: [['recordedAt', 'DESC']]
        });
        const isDuplicateBurst =
          lastLog &&
          nowTs - Number(lastLog.recordedAt) < 2000 &&
          Number(lastLog.ppm) === Math.round(numericPpm);

        if (!isDuplicateBurst) {
          await TelemetryLog.create({
            deviceId: id,
            ppm: Math.round(numericPpm),
            status: status || device.status || 'Online',
            recordedAt: nowTs
          });
        }
      } catch (logErr) {
        console.error('Failed to persist telemetry log to database:', logErr.message);
      }
    }

    // Sync to Firebase RTDB via REST API so that front-end receives it in real-time!
    if (!skipFirebaseSync) {
      try {
        const dbUrl = "https://carbonsense-iot-default-rtdb.asia-southeast1.firebasedatabase.app";
        
        // Fetch current data from Firebase RTDB to check for changes
        const currentRes = await fetch(`${dbUrl}/${id}.json`);
        let fbPpm = null;
        let fbStatus = null;
        let fbPing = 0;
        
        if (currentRes.ok) {
          const fbData = await currentRes.json();
          if (fbData) {
            fbPpm = fbData.nilai_ppm !== undefined && fbData.nilai_ppm !== '--' ? Number(fbData.nilai_ppm) : null;
            fbStatus = fbData.status !== undefined ? fbData.status : null;
            fbPing = fbData.ping !== undefined ? Number(fbData.ping) : 0;
          }
        }

        const ppmVal = ppm !== undefined && ppm !== '--' ? Number(ppm) : 0;
        const finalPpm = isNaN(ppmVal) ? 0 : ppmVal;
        const targetStatus = status || device.status || 'Online';

        // Check if the values in Firebase are already identical to the incoming values
        const isIdentical = (fbPpm === finalPpm && fbStatus === targetStatus);

        if (isIdentical) {
          console.log(`Skipped syncing telemetry to Firebase RTDB for ${id} (values are already identical: PPM=${finalPpm}, Status=${targetStatus}).`);
        } else if (status === 'Offline') {
          // Just update status to Offline in Firebase, do not increment ping and do not overwrite nilai_ppm
          await fetch(`${dbUrl}/${id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'Offline',
              lastActive: '5 menit yang lalu'
            })
          });
          console.log(`Successfully synced offline status for ${id} to Firebase RTDB via REST API.`);
        } else {
          const payload = {
            nilai_ppm: finalPpm,
            status: targetStatus,
            lastActive: 'Baru saja',
            ping: fbPing + 1
          };

          await fetch(`${dbUrl}/${id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          console.log(`Successfully synced telemetry for ${id} to Firebase RTDB via REST API. Ping incremented to ${fbPing + 1}.`);
        }
      } catch (fbErr) {
        console.error('Failed to sync telemetry to Firebase RTDB REST:', fbErr.message);
      }
    } else {
      console.log(`Skipped syncing telemetry to Firebase RTDB for device ${id} (skipFirebaseSync is true).`);
    }

    res.json({ message: 'Telemetry berhasil diperbarui.', device });
  } catch (error) {
    console.error('Update telemetry error:', error);
    res.status(500).json({ error: 'Gagal memperbarui telemetry.' });
  }
});

// Get Persistent Telemetry History for a Device
app.get('/api/devices/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5000, 10000);

    const logs = await TelemetryLog.findAll({
      where: { deviceId: id },
      order: [['recordedAt', 'DESC']],
      limit
    });

    const formatted = logs.reverse().map(l => ({
      timestamp: String(l.recordedAt),
      value: Number(l.ppm),
      status: l.status
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get device history error:', error);
    res.status(500).json({ error: 'Gagal memuat riwayat telemetri perangkat.' });
  }
});

// Update Device Details (Admin helper)
app.put('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newId, userEmail, status, ppm } = req.body;

    let updatedId = id;
    if (newId && newId !== id) {
      const existing = await Device.findByPk(newId);
      if (existing) {
        return res.status(400).json({ error: 'Device ID baru sudah digunakan.' });
      }
      await Device.update({ id: newId }, { where: { id } });
      await TelemetryLog.update({ deviceId: newId }, { where: { deviceId: id } });
      updatedId = newId;
    }

    const device = await Device.findByPk(updatedId);
    if (!device) {
      return res.status(404).json({ error: 'Perangkat tidak ditemukan.' });
    }

    if (userEmail !== undefined) {
      device.userEmail = userEmail ? userEmail.trim() : null;
    }
    if (status !== undefined) device.status = status;
    if (ppm !== undefined) device.ppm = ppm;
    device.lastActive = 'Baru saja';

    await device.save();
    res.json({ message: 'Perangkat berhasil diperbarui.', device });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Gagal memperbarui perangkat.' });
  }
});

// Delete Device (Admin optional helper)
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({ error: 'Perangkat tidak ditemukan.' });
    }
    await device.destroy();
    res.json({ message: 'Perangkat berhasil dihapus.' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Gagal menghapus perangkat.' });
  }
});

// AI Recommendation Proxy Route (Keeps API key secure in backend env)
app.post('/api/ai/recommendation', async (req, res) => {
  try {
    const { question, profile, carbonLevel, type, isOffline, chatHistory } = req.body;
    const deepseekKey = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

    if (!deepseekKey) {
      return res.status(500).json({ error: 'API Key DeepSeek tidak terkonfigurasi di server.' });
    }

    let systemPrompt = '';
    let userMessage = '';

    if (type === 'profile_summary') {
      systemPrompt = `Anda adalah CarbonSense AI Assistant. Tugas Anda adalah memberikan analisis singkat profil ruangan pengguna yang baru saja diatur pada onboarding.

ATURAN STRUKTUR JAWABAN (WAJIB):
1. JANGAN gunakan kalimat pembuka, kata pengantar, sapaan, ramah-tamah, atau filler pembuka (seperti "Tentu, ini adalah...", "Halo!", "Berikut adalah..."). Langsung berikan inti analisis profil ruangan.
2. JAWABAN HARUS SINGKAT (Maksimal 3 kalimat) dan ditulis dengan bahasa Indonesia yang natural, mengalir, dan mudah dipahami.
3. Hindari format kaku seperti template formulir yang hanya menyebutkan ulang daftar jawaban. Sebaliknya, buat analisis singkat yang menyatu secara kontekstual mengenai risiko akumulasi karbon di ruangan tersebut dan cara CarbonSense AI membantu memantaunya.
4. Gunakan format markdown tebal (**) pada kata kunci penting.`;

      userMessage = `Berikut adalah detail profil ruangan saya:
- Lokasi: ${profile?.lokasi || 'Tidak ditentukan'}
- Luas Ruangan: ${profile?.luas_ruang || 'Tidak ditentukan'}
- Sirkulasi: ${profile?.sirkulasi || 'Tidak ditentukan'}
- Hunian: ${profile?.kapasitas || 'Tidak ditentukan'}
- Polutan Terdekat: ${profile?.polutan?.join(', ') || 'Tidak Ada'}
- Kelompok Rentan: ${profile?.rentan || 'Tidak Ada'}
- Detektor Tambahan: ${profile?.detektor_lain || 'Tidak Ada'}

Berikan ringkasan analisis profil ruangan saya yang ramah, alami, dan tidak kaku dalam bahasa Indonesia.`;
    } else if (type === 'dashboard_advice') {
      systemPrompt = `Anda adalah CarbonSense AI Assistant, pakar keselamatan kualitas udara dalam ruangan.
Tugas Anda adalah memberikan analisis kondisi udara singkat (maksimal 2-3 kalimat, maks 50 kata) berdasarkan data sensor dan profil ruangan pengguna dalam bahasa Indonesia yang ramah dan mudah dipahami orang awam.
JANGAN gunakan kalimat pembuka seperti "Halo" atau "Tentu". Langsung berikan analisis singkat dan 1 saran praktis.

DATA RUANGAN & SENSOR SAAT INI:
- Lokasi: ${profile?.lokasi || 'Ruangan Utama'}
- Luas Ruangan: ${profile?.luas_ruang || 'Sedang'}
- Sirkulasi: ${profile?.sirkulasi || 'Jendela sering dibuka'}
- Sumber Gas/Asap Terdekat: ${profile?.polutan?.join(', ') || 'Tidak Ada'}
- Status Koneksi: ${isOffline ? 'OFFLINE' : 'ONLINE'}
- Kadar Gas CO Saat Ini: ${isOffline ? 'OFFLINE' : `${carbonLevel ?? 0} PPM`} (Aman <= 700, Waspada 701-1200, Bahaya > 1200)`;

      userMessage = isOffline
        ? 'Alat sedang offline. Berikan 2 kalimat singkat untuk mengingatkan pengguna menyalakan alat dan mengecek WiFi.'
        : `Berikan analisis singkat kondisi udara saat ini (${carbonLevel ?? 0} PPM) dan 1 saran pencegahan khusus untuk ruangan ${profile?.lokasi || 'ini'}.`;
    } else {
      systemPrompt = `Anda adalah CarbonSense AI Assistant, kecerdasan buatan terintegrasi untuk pendeteksian gas karbon monoksida (CO) dan kualitas udara dalam ruangan.
Tugas Anda adalah memantau, mendiagnosis, memberikan rekomendasi pencegahan, keselamatan, serta instruksi evakuasi darurat dalam bahasa Indonesia yang ringkas, ramah, dan solutif.

INFORMASI PENTING TENTANG PROYEK CARBONSENSE:
- CarbonSense adalah sistem pemantau kualitas udara terintegrasi berbasis IoT (ESP32) dengan sensor gas (MQ-7/MQ-9), database real-time (Firebase & PostgreSQL/MySQL melalui Supabase), serta asisten AI pintar.
- Ambang batas PPM:
  * <= 700 PPM: Aman & Normal (Kualitas udara baik).
  * 701 - 1200 PPM: Waspada (Kadar karbon meningkat, buka sirkulasi).
  * > 1200 PPM: Bahaya Kritis (Kadar membahayakan kesehatan, wajib evakuasi segera).

PANDUAN AKTIVASI / MENYALAKAN ALAT CARBONSENSE DARI AWAL HINGGA AKHIR:
a. Hubungkan Perangkat ke Listrik: Pasang kabel Micro-USB atau USB-C ke papan ESP32 CarbonSense dan colokkan ke adaptor daya.
b. Hubungkan ke WiFi (Konfigurasi Pertama): Hubungkan HP/laptop ke WiFi Hotspot bernama "CarbonSense-AP". Portal web (Captive Portal) akan terbuka. Masukkan SSID dan password WiFi rumah Anda agar alat bisa online.
c. Kalibrasi Awal (Pre-heating): Tunggu 1-2 menit agar sensor MQ melakukan pemanasan awal agar pembacaan data PPM stabil.
d. Tautkan Perangkat: Masuk ke website CarbonSense, buka menu "Pilih Perangkat", dan masukkan ID Perangkat Anda (contoh: CS-DAPUR-01) agar terikat ke akun Anda.
e. Selesai: Buka Dashboard Anda di browser Edge, indikator status alat akan berubah menjadi "Online", dan grafik pemantauan karbon akan mulai terisi secara dinamis.

STATUS PERANGKAT SAAT INI:
- Lokasi Alat: ${profile?.lokasi || 'Tidak ditentukan'}
- Luas Ruangan: ${profile?.luas_ruang || 'Tidak ditentukan'}
- Pola Sirkulasi: ${profile?.sirkulasi || 'Tidak ditentukan'}
- Hunian Rata-rata: ${profile?.kapasitas || 'Tidak ditentukan'}
- Potensi Sumber Emisi: ${profile?.polutan?.join(', ') || 'Tidak Ada'}
- Kelompok Rentan: ${profile?.rentan || 'Tidak Ada'}
- Detektor Gas Lain: ${profile?.detektor_lain || 'Tidak Ada'}
- Status Koneksi: ${isOffline ? 'OFFLINE' : 'ONLINE'}
- Kadar CO Saat Ini: ${isOffline ? 'TIDAK TERSEDIA (OFFLINE)' : `${carbonLevel || 0} PPM`}

ATURAN KHUSUS STATUS OFFLINE (WAJIB):
Jika perangkat sedang OFFLINE, Anda harus menolak memberikan data angka PPM saat ini. Katakan dengan jelas bahwa perangkat sedang offline dan pengguna harus mengaktifkannya terlebih dahulu mengikuti langkah panduan aktivasi di atas agar asisten AI mengetahui kadar PPM terakhir yang masuk. Jangan pernah berhalusinasi menyatakan kadar PPM saat ini (misalnya 450 PPM) jika perangkat sedang offline!

ATURAN STRUKTUR RESPON Q&A:
1. JAWABAN HARUS SIMPEL DAN RINGKAS (Maksimal 120 kata). Gunakan bahasa Indonesia yang mudah dipahami orang awam.
2. Jika memberikan langkah-langkah, gunakan format poin berpenomoran huruf kecil seperti a., b., c. dan dipisah dengan baris baru agar mudah dibaca.
3. Jawab pertanyaan pengguna dengan tepat sasaran berdasarkan sejarah percakapan dan konteks ruangan.`;

      userMessage = question || `Berikan rekomendasi keselamatan evakuasi karena terdeteksi kadar karbon kritis sebesar ${carbonLevel} PPM!`;
    }

    let messages = [{ role: 'system', content: systemPrompt }];

    if (type !== 'profile_summary' && type !== 'dashboard_advice' && chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      // Clean history: ensure first non-system message is from 'user' (DeepSeek requires valid role alternation)
      const cleanedHistory = [];
      let seenUser = false;
      for (const msg of chatHistory.slice(-10)) {
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        if (!seenUser && role === 'assistant') continue;
        seenUser = true;
        if (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === role) {
          cleanedHistory[cleanedHistory.length - 1].content += '\n' + (msg.text || '');
        } else {
          cleanedHistory.push({ role, content: msg.text || '' });
        }
      }
      if (cleanedHistory.length > 0) {
        messages.push(...cleanedHistory);
      } else {
        messages.push({ role: 'user', content: userMessage });
      }
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        return res.status(401).json({
          error: 'API Key DeepSeek di server/.env tidak valid atau kadaluarsa (HTTP 401). Harap perbarui VITE_DEEPSEEK_API_KEY.'
        });
      }
      if (response.status === 402) {
        return res.status(402).json({
          error: 'Saldo / kuota DeepSeek API habis (HTTP 402). Harap isi ulang saldo di platform.deepseek.com.'
        });
      }
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Gagal menghasilkan jawaban dari AI.';
    res.json({ recommendation: reply });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ error: 'Gagal menghubungi asisten AI: ' + error.message });
  }
});

// Update User Profile (username)
app.put('/api/users/profile', async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email || !username) {
      return res.status(400).json({ error: 'Harap kirim email dan nama lengkap yang baru.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    user.username = username.trim();
    await user.save();
    res.json({ message: 'Profil berhasil diperbarui.', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat memperbarui profil.' });
  }
});

// Update User Password
app.put('/api/users/password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Harap kirim email dan password baru.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    if (oldPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Password lama yang dimasukkan salah.' });
      }
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password berhasil diperbarui.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat memperbarui password.' });
  }
});

// Start Fullstack Backend Server
const startServer = async () => {
  try {
    // Initialize Database (Connection & Auto Migration)
    await initDb();

    // Seed essential data
    await seedDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`CarbonSense Express Server running on port ${PORT}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
