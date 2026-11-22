import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Users, ArrowLeft, Plus, Code, QrCode, X, Copy, CheckCircle2, UserPlus, Search, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { ref, set, update, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [firebaseData, setFirebaseData] = useState<Record<string, any>>({});

  const handleLogout = () => {
    localStorage.removeItem('cs_admin_token');
    localStorage.removeItem('cs_admin_email');
    navigate('/admin');
  };

  useEffect(() => {
    const rootRef = ref(rtdb);
    const unsubscribe = onValue(
      rootRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setFirebaseData(data);
        }
      },
      (err) => {
        console.error('Firebase listen error:', err);
      }
    );
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
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

      await fetchData();

      setShowAddModal(false);
      setSelectedDevice(newDev);
      setShowQRModal(true);

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

      try {
        await update(ref(rtdb, selectedDevice.id), {
          userEmail: bindUserEmail,
          status: 'Online',
          lastActive: 'Baru saja'
        });
      } catch (fbErr) {
        console.error('Failed to update device userEmail in Firebase RTDB:', fbErr);
      }

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

      try {
        const { ref: fbRef, update: fbUpdate, remove: fbRemove, set: fbSet } = await import('firebase/database');
        const ppmVal = editPpm !== '--' ? Number(editPpm) : 0;
        const finalPpm = isNaN(ppmVal) ? 0 : ppmVal;

        if (newEditDeviceId && newEditDeviceId.trim() !== editDeviceId) {
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

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const displayedUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    const matchesUser =
      u.email.toLowerCase().includes(searchLower) || u.username.toLowerCase().includes(searchLower);
    const matchesDevice = devices.some(
      d => d.userEmail === u.email && d.id.toLowerCase().includes(searchLower)
    );
    return matchesUser || matchesDevice;
  });

  const displayedDevices = (
    currentView === 'warning_devices'
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
    <div className="min-h-screen bg-[#F0F9FF] text-[#0F172A] font-sans p-4 sm:p-8 md:p-12 relative">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0284C7] font-bold">
              PANEL ADMINISTRATOR
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-0.5">
              Admin Dashboard CarbonSense
            </h1>
            <p className="text-xs text-[#475569]">
              Manajemen Perangkat IoT ESP32, Penautan Pengguna, &amp; Kode Firmware
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-[#0284C7]/25"
            >
              <Plus className="w-4 h-4" /> Tambah Device Baru
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-300 bg-white hover:border-[#DC2626] text-[#475569] hover:text-[#DC2626] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Keluar
            </button>
          </div>
        </header>

        {/* Dynamic Metric Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('devices')}
            className={`p-6 bg-white border-2 rounded-3xl cursor-pointer transition-all relative overflow-hidden shadow-sm ${
              currentView === 'devices' ? 'border-[#0284C7]' : 'border-slate-200'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] flex items-center justify-center mb-3 text-[#0284C7]">
              <Cpu className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-[#0284C7]">{devices.length}</p>
            <p className="text-xs text-[#475569] font-bold mt-1">Total Perangkat Terdaftar</p>
            {currentView === 'devices' && (
              <motion.div layoutId="activeBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0284C7]" />
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('users')}
            className={`p-6 bg-white border-2 rounded-3xl cursor-pointer transition-all relative overflow-hidden shadow-sm ${
              currentView === 'users' ? 'border-[#0284C7]' : 'border-slate-200'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] flex items-center justify-center mb-3 text-[#0284C7]">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-[#0284C7]">{users.length}</p>
            <p className="text-xs text-[#475569] font-bold mt-1">Pengguna Terdaftar</p>
            {currentView === 'users' && (
              <motion.div layoutId="activeBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0284C7]" />
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('warning_devices')}
            className={`p-6 bg-[#FEF2F2] border-2 rounded-3xl cursor-pointer transition-all relative overflow-hidden shadow-sm ${
              currentView === 'warning_devices' ? 'border-[#DC2626]' : 'border-[#FECACA]'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mb-3 text-[#DC2626]">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-3xl font-black text-[#DC2626]">
              {devices.filter(d => getDeviceStatus(d) === 'Warning').length}
            </p>
            <p className="text-xs text-[#DC2626] font-bold mt-1">Perangkat Status Bahaya</p>
            {currentView === 'warning_devices' && (
              <motion.div layoutId="activeBorder" className="absolute bottom-0 left-0 right-0 h-1 bg-[#DC2626]" />
            )}
          </motion.div>
        </div>

        {/* Tables */}
        <AnimatePresence mode="wait">
          {currentView === 'users' ? (
            <motion.div
              key="users-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md"
            >
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Daftar Pengguna Terdaftar &amp; Perangkatnya
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors text-xs text-[#0F172A]"
                    placeholder="Cari pengguna, email, device..."
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#475569] bg-[#F9FAFB] border-b border-slate-200 uppercase font-bold">
                    <tr>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Perangkat Dimiliki</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedUsers.map((u, i) => {
                      const userDevices = devices.filter(d => d.userEmail === u.email);
                      return (
                        <tr key={i} className="hover:bg-[#F0F9FF]/60 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#0F172A]">{u.username}</td>
                          <td className="px-6 py-4 text-[#475569] font-mono">{u.email}</td>
                          <td className="px-6 py-4">
                            {userDevices.length === 0 ? (
                              <span className="text-slate-400 italic">Tidak ada perangkat</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {userDevices.map(d => (
                                  <span
                                    key={d.id}
                                    className="px-2.5 py-1 bg-[#E0F2FE] border border-[#0284C7]/30 text-[#0284C7] rounded-lg text-xs font-mono font-bold"
                                  >
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
                        <td colSpan={3} className="text-center py-8 text-[#475569]">
                          {users.length === 0
                            ? 'Belum ada pengguna terdaftar.'
                            : 'Tidak ada pengguna yang cocok dengan pencarian.'}
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
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md"
            >
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  {currentView === 'warning_devices'
                    ? 'Daftar Perangkat Status Bahaya'
                    : 'Daftar Perangkat Terdaftar'}
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors text-xs text-[#0F172A]"
                    placeholder="Cari device ID, pengguna, status..."
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#475569] bg-[#F9FAFB] border-b border-slate-200 uppercase font-bold">
                    <tr>
                      <th className="px-6 py-4">Device ID</th>
                      <th className="px-6 py-4">Pengguna</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">PPM Terakhir</th>
                      <th className="px-6 py-4">Aktivitas Terakhir</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedDevices.map((dev, i) => {
                      const st = getDeviceStatus(dev);
                      return (
                        <tr key={i} className="hover:bg-[#F0F9FF]/60 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#0284C7]">{dev.id}</td>
                          <td className="px-6 py-4 font-medium text-[#0F172A]">
                            {dev.userEmail || <span className="text-slate-400 italic">Belum Terdaftar</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                st === 'Online'
                                  ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                                  : st === 'Warning'
                                  ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                                  : st === 'Menunggu Bind'
                                  ? 'bg-[#FFEDD5] text-[#EA580C] border-[#FDBA74]'
                                  : 'bg-slate-100 text-[#475569] border-slate-300'
                              }`}
                            >
                              {st}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-[#0F172A]">{getDevicePPM(dev)}</td>
                          <td className="px-6 py-4 text-[#475569]">{dev.lastActive}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {(!dev.userEmail || dev.status === 'Menunggu Bind') && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedDevice(dev);
                                      setBindUserEmail(dev.userEmail || '');
                                      setShowBindModal(true);
                                    }}
                                    className="p-2 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] border border-[#0284C7]/20 transition-colors cursor-pointer"
                                    title="Tautkan Pengguna"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </button>
                                  {!dev.userEmail && (
                                    <button
                                      onClick={() => {
                                        setSelectedDevice(dev);
                                        setShowQRModal(true);
                                      }}
                                      className="p-2 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] border border-[#0284C7]/20 transition-colors cursor-pointer"
                                      title="Tampilkan QR Code"
                                    >
                                      <QrCode className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedDevice(dev);
                                  setShowSourceModal(true);
                                }}
                                className="p-2 rounded-xl bg-[#F9FAFB] hover:bg-slate-100 text-[#0F172A] border border-slate-300 transition-colors cursor-pointer"
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
                                className="p-2 rounded-xl bg-[#F9FAFB] hover:bg-[#E0F2FE] text-[#0284C7] border border-slate-300 transition-colors cursor-pointer"
                                title="Edit Perangkat"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDevice(dev.id)}
                                className="p-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] transition-colors cursor-pointer"
                                title="Hapus Perangkat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {displayedDevices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-[#475569]">
                          {devices.length === 0
                            ? 'Tidak ada perangkat terdaftar.'
                            : 'Tidak ada perangkat yang cocok dengan pencarian.'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Tautkan Akun ke Device</h3>
              <button
                disabled={bindSuccess}
                onClick={() => setShowBindModal(false)}
                className="text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {bindSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#16A34A]" />
                  <h4 className="text-xl font-extrabold text-[#0F172A] mb-2">Berhasil Ditautkan!</h4>
                  <p className="text-xs text-[#475569]">
                    Device <strong>{selectedDevice.id}</strong> sekarang milik <strong>{bindUserEmail}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBindUser} className="space-y-4">
                  <p className="text-xs text-[#475569] mb-4">
                    Pilih pengguna terdaftar untuk menautkan perangkat{' '}
                    <strong className="text-[#0284C7]">{selectedDevice.id}</strong>.
                  </p>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#475569]">Pilih Akun Pengguna</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white text-xs text-[#0F172A]"
                        placeholder="Cari berdasarkan username atau email..."
                      />
                    </div>

                    <div className="border border-slate-200 bg-[#F9FAFB] rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-200 p-2 space-y-1">
                      {filteredUsers.map((u) => {
                        const isSelected = bindUserEmail === u.email;
                        return (
                          <div
                            key={u.id}
                            onClick={() => setBindUserEmail(u.email)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#E0F2FE] border border-[#0284C7] text-[#0284C7]'
                                : 'hover:bg-white text-[#0F172A]'
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-bold text-xs text-[#0F172A]">{u.username}</p>
                              <p className="text-[11px] text-[#475569] font-mono">{u.email}</p>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#0284C7] text-white rounded-md uppercase">
                                Terpilih
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <p className="text-center py-6 text-xs text-[#475569] italic">
                          Tidak ada pengguna ditemukan.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!bindUserEmail}
                    className={`w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all mt-6 flex justify-center items-center gap-2 cursor-pointer ${
                      !bindUserEmail ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <UserPlus className="w-4 h-4" /> Konfirmasi Penautan
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Daftarkan Device Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">Nama Device (ID)</label>
                  <input
                    type="text"
                    required
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white text-sm text-[#0F172A] font-mono"
                    placeholder="Misal: CS-RUANGTAMU-02"
                  />
                  <p className="text-[11px] text-[#475569] mt-1.5">
                    Gunakan huruf kapital tanpa spasi untuk path Firebase RTDB.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">Status Awal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Online', 'Offline', 'Warning'].map(status => (
                      <label
                        key={status}
                        className={`p-3 border rounded-xl text-center cursor-pointer transition-colors text-xs font-bold ${
                          newDeviceStatus === status
                            ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]'
                            : 'border-slate-200 bg-[#F9FAFB] text-[#475569]'
                        }`}
                      >
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
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all mt-4 cursor-pointer shadow-md shadow-[#0284C7]/25"
                >
                  Buat Device &amp; Tampilkan QR
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-sm overflow-hidden text-center rounded-3xl shadow-2xl">
            <div className="p-5 pb-0 flex justify-end">
              <button
                onClick={() => setShowQRModal(false)}
                className="text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 pt-2">
              <h3 className="text-lg font-extrabold text-[#0F172A] mb-2">Device Berhasil Dibuat</h3>
              <p className="text-xs text-[#475569] mb-6">
                Minta pengguna melakukan scan QR Code di bawah ini untuk menautkan device{' '}
                <strong className="text-[#0284C7]">{selectedDevice.id}</strong>.
              </p>

              <div className="bg-white p-5 rounded-2xl inline-block mb-6 border border-slate-200 shadow-sm">
                <QRCodeSVG
                  value={`${window.location.origin}/register?device=${selectedDevice.id}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <button
                onClick={() => {
                  setShowQRModal(false);
                  setShowSourceModal(true);
                }}
                className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Lihat Source Code .ino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Code Modal */}
      {showSourceModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-[#F9FAFB]">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A]">Source Code Firmware `.ino`</h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Kode khusus untuk perangkat: <strong className="text-[#0284C7]">{selectedDevice.id}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleCopySourceCode}
                  className={`px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                    copied
                      ? 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]'
                      : 'bg-white border-slate-300 text-[#0F172A] hover:border-[#0284C7]'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Salin Kode
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSourceModal(false)}
                  className="p-2 border border-slate-300 bg-white text-[#475569] hover:text-[#0F172A] rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-900 font-mono text-xs text-sky-200">
              <pre>
                <code>
                  {TEMPLATE_SOURCE_CODE.replace(/\{\{DEVICE_NAME\}\}/g, selectedDevice.id)
                    .replace(/\{\{USER_EMAIL\}\}/g, selectedDevice.userEmail || 'Belum Terhubung')
                    .split('\n')
                    .map((line, i) => (
                      <div key={i} className="hover:bg-slate-800/70 px-2 py-0.5 rounded flex">
                        <span className="w-8 text-slate-500 select-none border-r border-slate-700 mr-4 text-right pr-2">
                          {i + 1}
                        </span>
                        <span
                          className={
                            line.includes('API_KEY') ||
                            line.includes('DATABASE_URL') ||
                            line.includes(selectedDevice.id)
                              ? 'text-sky-400 font-bold'
                              : ''
                          }
                        >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Edit Device: {editDeviceId}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditDeviceSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">
                    Device ID (Nama Device)
                  </label>
                  <input
                    type="text"
                    required
                    value={newEditDeviceId}
                    onChange={(e) => setNewEditDeviceId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white font-mono font-bold text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">
                    Email Pemilik (Kosongkan untuk Unbind)
                  </label>
                  <input
                    type="text"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white text-sm text-[#0F172A]"
                    placeholder="Contoh: user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">Status Perangkat</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Online', 'Offline', 'Warning'].map(status => (
                      <label
                        key={status}
                        className={`p-2.5 border rounded-xl text-center cursor-pointer transition-colors text-xs font-bold ${
                          editStatus === status
                            ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]'
                            : 'border-slate-200 bg-[#F9FAFB] text-[#475569]'
                        }`}
                      >
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
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">
                    Kadar CO (PPM) Terakhir
                  </label>
                  <input
                    type="text"
                    required
                    value={editPpm}
                    onChange={(e) => setEditPpm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-slate-300 rounded-xl focus:outline-none focus:border-[#0284C7] focus:bg-white text-sm text-[#0F172A]"
                    placeholder="Contoh: 450 atau --"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl transition-all mt-4 cursor-pointer shadow-md shadow-[#0284C7]/25"
                >
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
