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

// Seed default admin account and a few demo devices if none exist
const seedDatabase = async () => {
  try {
    // 1. Seed Admin
    const adminEmail = 'admin@carbonsense.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'Sistem Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Seeded default admin account: admin@carbonsense.com / admin123');
    }

    // 2. Seed default devices if database is empty
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

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Harap masukkan Admin ID/Email dan password.' });
    }

    // Support both login by username/ID (e.g. admin_1) or email
    const user = await User.findOne({ 
      where: { email } 
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Akun bukan administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password salah.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login Admin berhasil.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login admin.' });
  }
});


// ==================== DEVICE ROUTES ====================

// Get Devices (Admin sees all, users see their own via query filter or authorization)
app.get('/api/devices', async (req, res) => {
  try {
    const { email } = req.query;
    
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
