import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Users, ArrowLeft, Plus, Code, QrCode, X, Copy, CheckCircle2, UserPlus, Search, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface Device {
  id: string;
  user: string;
  userEmail?: string;
  status: string;
  ppm: number | string;
  lastActive: string;
}

const TEMPLATE_SOURCE_CODE = `#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WiFiManager.h>

// Helper library wajib dari Firebase
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define API_KEY "AIzaSyD421U8mdS4GT-E4ETxBkfz4A3VLgRtlFM"
#define DATABASE_URL "https://carbonsense-iot-default-rtdb.asia-southeast1.firebasedatabase.app"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

const int sensorPin = 34; // Pin Analog MQ135
const int buttonPin = 0;  // Pin untuk tombol BOOT bawaan ESP32

// Variabel untuk sistem Timer (Pengganti delay)
unsigned long previousMillis = 0;
const long interval = 2000; // Waktu jeda kirim data (2000 ms = 2 detik)

// Variabel untuk membaca durasi tombol ditekan
unsigned long buttonPressTime = 0;
bool isPressing = false;

void setup() {
  Serial.begin(115200);
  
  pinMode(sensorPin, INPUT);
  // Menggunakan resistor pull-up internal ESP32 untuk tombol
  pinMode(buttonPin, INPUT_PULLUP); 

  Serial.println("\\nMemulai sistem CarbonSense...");
  
  WiFiManager wm;
  
  // ESP32 mencoba menyambung ke WiFi yang dia ingat
  bool res = wm.autoConnect("Setup_CarbonSense");

  if(!res) {
    Serial.println("Gagal terhubung ke WiFi atau waktu tunggu habis. Restarting...");
    ESP.restart(); 
  } else {
    Serial.println("Yeay! Berhasil terhubung ke WiFi rumah!");
    Serial.print("Alamat IP: ");
    Serial.println(WiFi.localIP());
  }

  // Konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Koneksi ke Firebase Siap!");
  } else {
    Serial.printf("Error Firebase: %s\\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // =========================================================
  // 1. LOGIKA TOMBOL RESET WIFI (Ditekan Tahan 3 Detik)
  // =========================================================
  if (digitalRead(buttonPin) == LOW) { 
    if (!isPressing) {
      isPressing = true;
      buttonPressTime = millis();
      Serial.println("Tombol terdeteksi! Tahan 3 detik untuk RESET WiFi...");
    } else {
      if (millis() - buttonPressTime > 3000) {
        Serial.println("\\n[PERINGATAN] Menghapus memori WiFi...");
        WiFiManager wm;
        wm.resetSettings();
        Serial.println("Memori WiFi bersih! Me-restart alat untuk masuk mode Setup...");
        delay(1000);
        ESP.restart();
      }
    }
  } else {
    isPressing = false; 
  }

  // =========================================================
  // 2. LOGIKA PEMBACAAN SENSOR & FIREBASE (Tanpa Delay)
  // =========================================================
  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    int nilaiPPM = analogRead(sensorPin) * 0.75;
    String statusUdara = "aman"; 
    
    if (nilaiPPM > 1200) {
      statusUdara = "bahaya";
    }

    Serial.print("Nilai (PPM): ");
    Serial.print(nilaiPPM);
    Serial.print(" | Status: ");
    Serial.println(statusUdara);

    // Kirim ke Firebase
    if (Firebase.ready()) {
      Firebase.RTDB.setInt(&fbdo, "{{DEVICE_NAME}}/nilai_ppm", nilaiPPM);
      Firebase.RTDB.setString(&fbdo, "{{DEVICE_NAME}}/status", statusUdara);
      // Kirim ping counter sebagai heartbeat ke Firebase
      static int pingCount = 0;
      pingCount++;
      Firebase.RTDB.setInt(&fbdo, "{{DEVICE_NAME}}/ping", pingCount);
      // Parameter tambahan yang terdaftar di sistem
      Firebase.RTDB.setString(&fbdo, "{{DEVICE_NAME}}/lastActive", "Baru saja");
      Firebase.RTDB.setString(&fbdo, "{{DEVICE_NAME}}/userEmail", "{{USER_EMAIL}}");
    }
  }
}
`;

import { api } from '../lib/api';
import { ref, set, update, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';

export default function AdminDashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseData, setFirebaseData] = useState<Record<string, any>>({});

  useEffect(() => {
    const rootRef = ref(rtdb);
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFirebaseData(data);
      }
    }, (err) => {
      console.error('Firebase listen error:', err);
    });
    return () => unsubscribe();
  }, []);

  const getDeviceStatus = (dev: any) => {
    if (dev.status === 'Menunggu Bind') return 'Menunggu Bind';
    const fbDev = firebaseData[dev.id];
    if (fbDev && fbDev.status !== undefined && fbDev.nilai_ppm !== undefined && fbDev.nilai_ppm !== '--') {
      const fbStatus = fbDev.status;
      if (fbStatus === 'bahaya' || fbStatus === 'Warning') return 'Warning';
      if (fbStatus === 'aman' || fbStatus === 'Online') return 'Online';
      return fbStatus || dev.status;
    }
    return dev.status;
  };

  const getDevicePPM = (dev: any) => {
    const fbDev = firebaseData[dev.id];
    if (fbDev && fbDev.nilai_ppm !== undefined) {
      return fbDev.nilai_ppm;
    }
    return dev.ppm || '--';
  };
  const [currentView, setCurrentView] = useState<'devices' | 'users' | 'warning_devices'>('devices');

  // Search query inside the user selector of Bind Modal
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Global search query for tables
  const [searchQuery, setSearchQuery] = useState('');

  // Clear global search query when switching views
  useEffect(() => {
    setSearchQuery('');
  }, [currentView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesData, usersData] = await Promise.all([
        api.devices.list(),
        api.users.list()
      ]);
      setDevices(devicesData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);
  
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceStatus, setNewDeviceStatus] = useState('Offline');
  const [bindUserEmail, setBindUserEmail] = useState('');
  const [bindSuccess, setBindSuccess] = useState(false);
  
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // States for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDeviceId, setEditDeviceId] = useState('');
  const [newEditDeviceId, setNewEditDeviceId] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editStatus, setEditStatus] = useState('Online');
  const [editPpm, setEditPpm] = useState('--');

  // Clear query and selection on modal open/close
  useEffect(() => {
    if (!showBindModal) {
      setUserSearchQuery('');
      setBindUserEmail('');
    }
  }, [showBindModal]);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim()) return;

    try {
      const newDev = await api.devices.create({
        id: newDeviceId,
        status: newDeviceStatus
      });

      // Initialize in Firebase Realtime Database ONLY if it doesn't already exist there
      try {
        const fbDev = firebaseData[newDeviceId];
        if (!fbDev) {
          await set(ref(rtdb, newDeviceId), {
            nilai_ppm: '--',
            status: 'Offline',
            userEmail: '',
            lastActive: 'Belum Aktif',
            ping: 0
          });
        }
      } catch (fbErr) {
        console.error('Failed to initialize device in Firebase RTDB:', fbErr);
      }

      // Reload dashboard data
      await fetchData();

      setShowAddModal(false);
      setSelectedDevice(newDev);
      setShowQRModal(true);
      
      // Reset form
      setNewDeviceId('');
      setNewDeviceStatus('Offline');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan device.');
    }
  };

  const handleBindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !bindUserEmail.trim()) return;

    try {
      await api.devices.bind({
        deviceId: selectedDevice.id,
        userEmail: bindUserEmail
      });

      // Update in Firebase Realtime Database
      try {
        await update(ref(rtdb, selectedDevice.id), {
          userEmail: bindUserEmail,
          status: 'Online',
          lastActive: 'Baru saja'
        });
      } catch (fbErr) {
        console.error('Failed to update device userEmail in Firebase RTDB:', fbErr);
      }

      // Reload dashboard data
      await fetchData();

      setBindSuccess(true);
      setTimeout(() => {
        setBindSuccess(false);
        setShowBindModal(false);
        setBindUserEmail('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Gagal menautkan user.');
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus perangkat ${id}?`)) return;
    try {
      await api.devices.delete(id);
      
      // Delete from Firebase Realtime Database
      try {
        const { ref: fbRef, remove } = await import('firebase/database');
        await remove(fbRef(rtdb, id));
      } catch (fbErr) {
        console.error('Failed to delete from Firebase RTDB:', fbErr);
      }
      
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perangkat.');
    }
  };

  const handleEditDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.devices.update(editDeviceId, {
        newId: newEditDeviceId !== editDeviceId ? newEditDeviceId.trim() : undefined,
        userEmail: editUserEmail ? editUserEmail.trim() : null,
        status: editStatus,
        ppm: editPpm
      });

      // Update Firebase Realtime Database as well
      try {
        const { ref: fbRef, update: fbUpdate, remove: fbRemove, set: fbSet } = await import('firebase/database');
        const ppmVal = editPpm !== '--' ? Number(editPpm) : 0;
        const finalPpm = isNaN(ppmVal) ? 0 : ppmVal;

        if (newEditDeviceId && newEditDeviceId.trim() !== editDeviceId) {
          // Move node to new Device ID
          const oldData = firebaseData[editDeviceId] || {};
          const newData = {
            ...oldData,
            userEmail: editUserEmail ? editUserEmail.trim() : '',
            status: editStatus,
            nilai_ppm: finalPpm,
            lastActive: 'Baru saja'
          };
          
          await fbSet(fbRef(rtdb, newEditDeviceId.trim()), newData);
          await fbRemove(fbRef(rtdb, editDeviceId));
        } else {
          // Regular update
          await fbUpdate(fbRef(rtdb, editDeviceId), {
            userEmail: editUserEmail ? editUserEmail.trim() : '',
            status: editStatus,
            nilai_ppm: finalPpm
          });
        }
      } catch (fbErr) {
        console.error('Failed to sync edit to Firebase RTDB:', fbErr);
      }

      setShowEditModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui perangkat.');
    }
  };

  const handleCopySourceCode = () => {
    if (!selectedDevice) return;
    const emailStr = selectedDevice.userEmail || 'Belum Terhubung';
    const sourceCode = TEMPLATE_SOURCE_CODE
      .replace(/\{\{DEVICE_NAME\}\}/g, selectedDevice.id)
      .replace(/\{\{USER_EMAIL\}\}/g, emailStr);
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const displayedUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    const matchesUser = u.email.toLowerCase().includes(searchLower) || u.username.toLowerCase().includes(searchLower);
    const matchesDevice = devices.some(d => d.userEmail === u.email && d.id.toLowerCase().includes(searchLower));
    return matchesUser || matchesDevice;
  });

  const displayedDevices = (currentView === 'warning_devices' 
    ? devices.filter(d => getDeviceStatus(d) === 'Warning') 
    : devices
  ).filter(d => {
    const searchLower = searchQuery.toLowerCase();
    const deviceId = d.id.toLowerCase();
    const userEmail = (d.userEmail || '').toLowerCase();
    const status = getDeviceStatus(d).toLowerCase();
    const ppm = String(getDevicePPM(d)).toLowerCase();
    const lastActive = (d.lastActive || '').toLowerCase();
    return (
      deviceId.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      status.includes(searchLower) ||
      ppm.includes(searchLower) ||
      lastActive.includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen text-[var(--cs-text)] font-sans p-6 md:p-12 relative" style={{ background: 'var(--cs-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-wide uppercase mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Admin Dashboard</h1>
            <p className="text-[var(--cs-text-dim)]">Manajemen Perangkat CarbonSense</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-black rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 hover:brightness-110 shadow-md"
              style={{ background: 'var(--cs-amber)', boxShadow: '0 4px 15px -4px var(--cs-amber-glow)' }}
            >
              <Plus className="w-4 h-4" /> Tambah Device
            </button>
            <Link to="/" className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 border" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}>
              <ArrowLeft className="w-4 h-4" /> Keluar
            </Link>
          </div>
        </header>

        {/* Dynamic Metric Cards with Framer Motion Animations */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            whileHover={{ scale: 1.03, y: -6, boxShadow: '0 25px 30px -10px rgba(251,191,36,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('devices')}
            className={`p-6 border rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden`}
            style={{ 
              background: 'var(--cs-surface)', 
              borderColor: currentView === 'devices' ? 'var(--cs-amber)' : 'var(--cs-border)' 
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,var(--cs-amber-glow)_0,transparent_70%)] opacity-30 pointer-events-none" />
            <Cpu className="w-6 h-6 mb-4" style={{ color: 'var(--cs-amber)' }} />
            <motion.p 
              key={devices.length}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold" 
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)' }}
            >
              {devices.length}
            </motion.p>
            <p className="text-sm text-[var(--cs-text-dim)] font-medium">Total Device Aktif</p>
            {currentView === 'devices' && (
              <motion.div layoutId="activeBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--cs-amber)]" />
            )}
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03, y: -6, boxShadow: '0 25px 30px -10px rgba(251,191,36,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('users')}
            className={`p-6 border rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden`}
            style={{ 
              background: 'var(--cs-surface)', 
              borderColor: currentView === 'users' ? 'var(--cs-amber)' : 'var(--cs-border)' 
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,var(--cs-amber-glow)_0,transparent_70%)] opacity-30 pointer-events-none" />
            <Users className="w-6 h-6 mb-4" style={{ color: 'var(--cs-amber)' }} />
            <motion.p 
              key={users.length}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold" 
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)' }}
            >
              {users.length}
            </motion.p>
            <p className="text-sm text-[var(--cs-text-dim)] font-medium">Pengguna Terdaftar</p>
            {currentView === 'users' && (
              <motion.div layoutId="activeBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--cs-amber)]" />
            )}
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03, y: -6, boxShadow: '0 25px 30px -10px rgba(239,68,68,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentView('warning_devices')}
            className={`p-6 border rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden`}
            style={{ 
              background: 'color-mix(in oklab, var(--cs-danger) 8%, var(--cs-surface))', 
              borderColor: currentView === 'warning_devices' ? 'var(--cs-danger)' : 'color-mix(in oklab, var(--cs-danger) 20%, var(--cs-border))' 
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0,transparent_70%)] pointer-events-none" />
            <Activity className="w-6 h-6 mb-4 animate-pulse" style={{ color: 'var(--cs-danger-text)' }} />
            <motion.p 
              key={devices.filter(d => d.status === 'Warning').length}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold" 
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-danger-text)' }}
            >
              {devices.filter(d => d.status === 'Warning').length}
            </motion.p>
            <p className="text-sm" style={{ color: 'var(--cs-danger-text)' }}>Device Status Bahaya</p>
            {currentView === 'warning_devices' && (
              <motion.div layoutId="activeBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--cs-danger)]" />
            )}
          </motion.div>
        </div>

        {/* Render Tables with Framer Motion Transitions */}
        <AnimatePresence mode="wait">
          {currentView === 'users' ? (
            <motion.div
              key="users-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="border rounded-3xl overflow-hidden shadow-xl" 
              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
            >
              <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--cs-border)' }}>
                <h2 className="text-lg font-bold">Daftar Pengguna Terdaftar & Perangkatnya</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-650 text-sm text-white"
                    style={{ borderColor: 'var(--cs-border)' }}
                    placeholder="Cari pengguna, email, device..."
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[var(--cs-text-dim)]" style={{ background: 'var(--cs-surface-2)' }}>
                    <tr>
                      <th className="px-6 py-4 font-medium">Username</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Perangkat Dimiliki</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {displayedUsers.map((u, i) => {
                      const userDevices = devices.filter(d => d.userEmail === u.email);
                      return (
                        <tr key={i} className="hover:bg-zinc-800/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{u.username}</td>
                          <td className="px-6 py-4 text-[var(--cs-text-dim)] font-mono">{u.email}</td>
                          <td className="px-6 py-4">
                            {userDevices.length === 0 ? (
                              <span className="text-zinc-500 text-xs italic">Tidak ada perangkat</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {userDevices.map(d => (
                                  <span key={d.id} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-mono font-bold">
                                    {d.id} ({d.status})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {displayedUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-zinc-500">
                          {users.length === 0 ? 'Belum ada pengguna terdaftar.' : 'Tidak ada pengguna yang cocok dengan pencarian.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="devices-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="border rounded-3xl overflow-hidden shadow-xl" 
              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
            >
              <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--cs-border)' }}>
                <h2 className="text-lg font-bold">
                  {currentView === 'warning_devices' ? 'Daftar Perangkat Bahaya' : 'Daftar Perangkat Terdaftar'}
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-650 text-sm text-white"
                    style={{ borderColor: 'var(--cs-border)' }}
                    placeholder="Cari device ID, pengguna, status..."
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[var(--cs-text-dim)]" style={{ background: 'var(--cs-surface-2)' }}>
                    <tr>
                      <th className="px-6 py-4 font-medium">Device ID</th>
                      <th className="px-6 py-4 font-medium">Pengguna</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">PPM Terakhir</th>
                      <th className="px-6 py-4 font-medium">Aktivitas Terakhir</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {displayedDevices.map((dev, i) => (
                      <tr key={i} className="hover:bg-zinc-800/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold" style={{ color: 'var(--cs-amber)' }}>{dev.id}</td>
                        <td className="px-6 py-4">{dev.userEmail || 'Belum Terdaftar'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            getDeviceStatus(dev) === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            getDeviceStatus(dev) === 'Warning' ? 'bg-red-500/10 text-red-450 border-red-500/20' :
                            getDeviceStatus(dev) === 'Menunggu Bind' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {getDeviceStatus(dev)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">{getDevicePPM(dev)}</td>
                        <td className="px-6 py-4 text-[var(--cs-text-dim)]">{dev.lastActive}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(!dev.userEmail || dev.status === 'Menunggu Bind') && (
                              <>
                                <button 
                                  onClick={() => { 
                                    setSelectedDevice(dev); 
                                    setBindUserEmail(dev.userEmail || '');
                                    setShowBindModal(true); 
                                  }}
                                  className="p-2 rounded-lg transition-colors border cursor-pointer"
                                  style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))', color: 'var(--cs-amber)' }}
                                  title="Tautkan Pengguna"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                                {!dev.userEmail && (
                                  <button 
                                    onClick={() => { setSelectedDevice(dev); setShowQRModal(true); }}
                                    className="p-2 rounded-lg transition-colors border cursor-pointer"
                                    style={{ background: 'color-mix(in oklab, var(--cs-amber) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--cs-amber) 20%, var(--cs-border))', color: 'var(--cs-amber)' }}
                                    title="Tampilkan QR Code"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            <button 
                              onClick={() => { setSelectedDevice(dev); setShowSourceModal(true); }}
                              className="p-2 rounded-lg transition-colors border cursor-pointer"
                              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                              title="Lihat Source Code"
                            >
                              <Code className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { 
                                setEditDeviceId(dev.id); 
                                setNewEditDeviceId(dev.id);
                                setEditUserEmail(dev.userEmail || '');
                                setEditStatus(getDeviceStatus(dev));
                                setEditPpm(getDevicePPM(dev));
                                setShowEditModal(true); 
                              }}
                              className="p-2 rounded-lg transition-colors border cursor-pointer"
                              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-amber)' }}
                              title="Edit Perangkat"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDevice(dev.id)}
                              className="p-2 rounded-lg transition-colors border cursor-pointer hover:text-red-400"
                              style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)', color: 'var(--cs-danger-text)' }}
                              title="Hapus Perangkat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayedDevices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-zinc-500">
                          {devices.length === 0 ? 'Tidak ada perangkat terdaftar.' : 'Tidak ada perangkat yang cocok dengan pencarian.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bind User Modal */}
      {showBindModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--cs-border)' }}>
              <h3 className="text-xl font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Tautkan Akun ke Device</h3>
              <button disabled={bindSuccess} onClick={() => setShowBindModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {bindSuccess ? (
                <div className="text-center py-6">
                   <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--cs-amber)' }} />
                   <h4 className="text-xl font-bold mb-2">Berhasil Ditautkan!</h4>
                   <p className="text-[var(--cs-text-dim)]">Device {selectedDevice.id} sekarang milik {bindUserEmail}.</p>
                </div>
              ) : (
                <form onSubmit={handleBindUser} className="space-y-4">
                  <p className="text-sm text-[var(--cs-text-dim)] mb-4">
                    Pilih pengguna terdaftar untuk menautkan perangkat <strong style={{ color: 'var(--cs-amber)' }}>{selectedDevice.id}</strong>.
                  </p>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-[var(--cs-text-dim)]">Pilih Akun Pengguna</label>
                    
                    {/* Real-time Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-650 text-sm text-white"
                        style={{ borderColor: 'var(--cs-border)' }}
                        placeholder="Cari berdasarkan username atau email..."
                      />
                      {userSearchQuery && (
                        <button 
                          type="button" 
                          onClick={() => setUserSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Scrollable list selector */}
                    <div className="border rounded-2xl max-h-48 overflow-y-auto divide-y divide-zinc-800 p-2 space-y-1" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--cs-border)' }}>
                      {filteredUsers.map((u) => {
                        const isSelected = bindUserEmail === u.email;
                        return (
                          <div 
                            key={u.id}
                            onClick={() => setBindUserEmail(u.email)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                              isSelected ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'hover:bg-zinc-800/40 text-zinc-300'
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-bold text-sm text-white">{u.username}</p>
                              <p className="text-xs text-zinc-500 font-mono">{u.email}</p>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-md uppercase tracking-wider">Terpilih</span>
                            )}
                          </div>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <p className="text-center py-6 text-xs text-zinc-500 italic">Tidak ada pengguna ditemukan.</p>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!bindUserEmail}
                    className={`w-full py-3 text-black font-bold rounded-xl transition-all mt-6 flex justify-center items-center gap-2 cursor-pointer ${
                      !bindUserEmail ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'
                    }`} 
                    style={{ background: 'var(--cs-amber)', boxShadow: bindUserEmail ? '0 4px 15px -4px var(--cs-amber-glow)' : 'none' }}
                  >
                    <UserPlus className="w-5 h-5" /> Konfirmasi Binding
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--cs-border)' }}>
              <h3 className="text-xl font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Daftarkan Device Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Nama Device (ID)</label>
                  <input 
                    type="text" 
                    required 
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-700" 
                    style={{ borderColor: 'var(--cs-border)' }}
                    placeholder="Misal: CS-RUANGTAMU-02" 
                  />
                  <p className="text-xs text-zinc-500 mt-2">Gunakan format kapital tanpa spasi untuk menghindari error pada Firebase path.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Status Awal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Online', 'Offline', 'Warning'].map(status => (
                      <label key={status} className="p-3 border rounded-xl text-center cursor-pointer transition-colors relative" style={{
                        borderColor: newDeviceStatus === status ? 'var(--cs-amber)' : 'var(--cs-border)',
                        background: newDeviceStatus === status ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface))' : 'rgba(0,0,0,0.2)',
                        color: newDeviceStatus === status ? 'var(--cs-amber)' : 'var(--cs-text-dim)'
                      }}>
                        <input 
                          type="radio" 
                          name="status" 
                          value={status} 
                          className="sr-only"
                          checked={newDeviceStatus === status}
                          onChange={(e) => setNewDeviceStatus(e.target.value)}
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-3 text-[#0c0a08] font-bold rounded-xl transition-all mt-6 cursor-pointer hover:brightness-110" style={{ background: 'var(--cs-amber)', boxShadow: '0 4px 15px -4px var(--cs-amber-glow)' }}>
                  Buat Device & Generate QR
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border w-full max-w-sm overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200 rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <div className="p-6 pb-0 flex justify-end">
              <button onClick={() => setShowQRModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 pt-2">
              <h3 className="text-xl font-bold tracking-wide uppercase mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Device Berhasil Dibuat</h3>
              <p className="text-sm text-[var(--cs-text-dim)] mb-8">
                Minta pengguna untuk melakukan scan QR Code di bawah ini untuk mendaftar dan menautkan device <strong style={{ color: 'var(--cs-amber)' }}>{selectedDevice.id}</strong>.
              </p>
              
              <div className="bg-white p-6 rounded-2xl inline-block mb-8">
                <QRCodeSVG 
                  value={`${window.location.origin}/register?device=${selectedDevice.id}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowQRModal(false);
                    setShowSourceModal(true);
                  }}
                  className="flex-1 py-3 hover:bg-zinc-700 font-medium rounded-xl border transition-colors cursor-pointer text-white"
                  style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}
                >
                  Lihat Source Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Code Modal */}
      {showSourceModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <div className="p-6 border-b flex items-center justify-between bg-zinc-900/80 backdrop-blur" style={{ borderColor: 'var(--cs-border)' }}>
              <div>
                <h3 className="text-xl font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Source Code Firmware \`.ino\`</h3>
                <p className="text-sm text-[var(--cs-text-dim)] mt-1">Generated khusus untuk device: <strong style={{ color: 'var(--cs-amber)' }}>{selectedDevice.id}</strong></p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCopySourceCode} 
                  className="px-4 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    background: copied ? 'color-mix(in oklab, var(--cs-amber) 12%, transparent)' : 'var(--cs-surface)',
                    borderColor: copied ? 'var(--cs-amber)' : 'var(--cs-border)',
                    color: copied ? 'var(--cs-amber)' : 'var(--cs-text)'
                  }}
                >
                  {copied ? <><CheckCircle2 className="w-4 h-4" /> Tersalin!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
                </button>
                <button onClick={() => setShowSourceModal(false)} className="p-2 border text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer" style={{ borderColor: 'var(--cs-border)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-zinc-950 font-mono text-sm">
              <pre className="text-amber-300/80">
                <code>
                  {TEMPLATE_SOURCE_CODE
                    .replace(/\{\{DEVICE_NAME\}\}/g, selectedDevice.id)
                    .replace(/\{\{USER_EMAIL\}\}/g, selectedDevice.userEmail || 'Belum Terhubung')
                    .split('\n')
                    .map((line, i) => (
                    <div key={i} className="hover:bg-zinc-900/50 px-2 py-0.5 rounded flex">
                      <span className="w-8 text-zinc-650 select-none border-r mr-4 text-right pr-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>{i + 1}</span>
                      <span className={line.includes('API_KEY') || line.includes('DATABASE_URL') || line.includes('emisi_pabrik') || line.includes(selectedDevice.id) ? 'text-amber-400' : ''}>
                        {line}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 rounded-[2rem]" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--cs-border)' }}>
              <h3 className="text-xl font-bold tracking-wide uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Edit Device: {editDeviceId}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditDeviceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Device ID (Nama Device)</label>
                  <input 
                    type="text" 
                    required 
                    value={newEditDeviceId}
                    onChange={(e) => setNewEditDeviceId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-700 font-mono font-bold" 
                    style={{ borderColor: 'var(--cs-border)' }}
                    placeholder="Misal: CS-RUANGTAMU-02" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Email Pemilik (Kosongkan untuk Unbind)</label>
                  <input 
                    type="text" 
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-700" 
                    style={{ borderColor: 'var(--cs-border)' }}
                    placeholder="Contoh: user@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Status Perangkat</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Online', 'Offline', 'Warning'].map(status => (
                      <label key={status} className="p-3 border rounded-xl text-center cursor-pointer transition-colors relative" style={{
                        borderColor: editStatus === status ? 'var(--cs-amber)' : 'var(--cs-border)',
                        background: editStatus === status ? 'color-mix(in oklab, var(--cs-amber) 10%, var(--cs-surface))' : 'rgba(0,0,0,0.2)',
                        color: editStatus === status ? 'var(--cs-amber)' : 'var(--cs-text-dim)'
                      }}>
                        <input 
                          type="radio" 
                          name="editStatus" 
                          value={status} 
                          className="sr-only"
                          checked={editStatus === status}
                          onChange={(e) => setEditStatus(e.target.value)}
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Kadar CO (PPM) Terakhir</label>
                  <input 
                    type="text" 
                    required 
                    value={editPpm}
                    onChange={(e) => setEditPpm(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-700" 
                    style={{ borderColor: 'var(--cs-border)' }}
                    placeholder="Contoh: 450 atau --" 
                  />
                </div>
                <button type="submit" className="w-full py-3 text-[#0c0a08] font-bold rounded-xl transition-all mt-6 cursor-pointer hover:brightness-110" style={{ background: 'var(--cs-amber)', boxShadow: '0 4px 15px -4px var(--cs-amber-glow)' }}>
                  Simpan Perubahan
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
