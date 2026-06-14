import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { User, Device } from './models.js';

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
        { id: 'CS-RUANG-03', userEmail: 'rahman@example.com', status: 'Offline', ppm: '--', lastActive: '5 jam lalu' },
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
      status: status || 'Online',
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
    device.lastActive = 'Baru saja';
    await device.save();

    res.json({ message: 'Perangkat berhasil ditautkan.', device });
  } catch (error) {
    console.error('Bind device error:', error);
    res.status(500).json({ error: 'Gagal menautkan perangkat.' });
  }
});

// Telemetry Endpoint (e.g. for IoT devices or web simulation to push data)
app.post('/api/devices/telemetry', async (req, res) => {
  try {
    const { id, ppm, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Device ID wajib dikirim.' });
    }

    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({ error: 'Perangkat tidak terdaftar.' });
    }

    if (ppm !== undefined) device.ppm = String(ppm);
    if (status !== undefined) device.status = status;
    device.lastActive = 'Baru saja';
    
    await device.save();
    res.json({ message: 'Telemetry berhasil diperbarui.', device });
  } catch (error) {
    console.error('Update telemetry error:', error);
    res.status(500).json({ error: 'Gagal memperbarui telemetry.' });
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
    const { question, profile, carbonLevel, type } = req.body;
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
    } else {
      systemPrompt = `Anda adalah CarbonSense AI Assistant, sebuah kecerdasan buatan pendeteksi karbon monoksida (CO) dan kualitas udara di dalam ruangan.
Tugas Anda adalah menganalisis kondisi udara berdasarkan telemetri sensor PPM karbon real-time dan profil detail ruangan user, lalu memberikan rekomendasi keselamatan atau evakuasi darurat dalam bahasa Indonesia yang sangat sederhana dan ringkas.

ATURAN STRUKTUR JAWABAN (WAJIB):
1. JANGAN gunakan kalimat pembuka/kata pengantar, sapaan, ramah-tamah, atau filler pembuka (seperti "Tentu, ini adalah...", "Halo!", "Sebagai asisten...", "Berdasarkan data..."). Langsung berikan inti instruksi keselamatan atau status udara.
2. JAWABAN HARUS SIMPEL, SINGKAT, DAN CONCISE (Maksimal 100 kata). Gunakan bahasa Indonesia yang mudah dipahami orang awam saat kondisi panik.
3. FORMAT LANGKAH EVAKUASI / TINDAKAN DARURAT: Jika ada langkah-langkah evakuasi atau tindakan keselamatan, Anda WAJIB memformatnya menggunakan poin-poin dengan penomoran huruf kecil dan garis baru seperti contoh berikut:
a. [Langkah 1]
b. [Langkah 2]
c. [Langkah 3]
Setiap poin harus pendek, padat, langsung pada tindakan nyata, dan dipisahkan dengan baris baru. DILARANG membuat satu paragraf besar yang rumit dibaca.
4. Sesuaikan respon secara langsung dengan data lingkungan berikut:
- Lokasi Alat: ${profile?.lokasi || 'Tidak ditentukan'}
- Luas Ruangan: ${profile?.luas_ruang || 'Tidak ditentukan'}
- Pola Sirkulasi: ${profile?.sirkulasi || 'Tidak ditentukan'}
- Hunian: ${profile?.kapasitas || 'Tidak ditentukan'}
- Potensi Sumber Emisi: ${profile?.polutan?.join(', ') || 'Tidak Ada'}
- Kelompok Kesehatan Rentan: ${profile?.rentan || 'Tidak Ada'}
- Detektor Gas Lain: ${profile?.detektor_lain || 'Tidak Ada'}
- Kadar CO Saat Ini: ${carbonLevel || 0} PPM

Ambang Batas PPM:
- <= 700: Aman & Normal. Kualitas udara baik.
- 701 - 1200: Waspada. Kadar karbon meningkat, disarankan membuka sirkulasi.
- > 1200: Bahaya Kritis. Kadar karbon membahayakan kesehatan, evakuasi darurat wajib dilakukan segera.`;

      userMessage = question || `Berikan rekomendasi keselamatan evakuasi karena terdeteksi kadar karbon kritis sebesar ${carbonLevel} PPM!`;
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
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
