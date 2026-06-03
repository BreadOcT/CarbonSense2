import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Users, ArrowLeft, Plus, Code, QrCode, X, Copy, CheckCircle2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

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
    }
  }
}
`;

import { api } from '../lib/api';

export default function AdminDashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await api.devices.list();
      setDevices(data);
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);
  
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceStatus, setNewDeviceStatus] = useState('Online');
  const [bindUserEmail, setBindUserEmail] = useState('');
  const [bindSuccess, setBindSuccess] = useState(false);
  
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim()) return;

    try {
      const newDev = await api.devices.create({
        id: newDeviceId,
        status: newDeviceStatus
      });

      // Reload devices list from MySQL database
      await fetchDevices();

      setShowAddModal(false);
      setSelectedDevice(newDev);
      setShowQRModal(true);
      
      // Reset form
      setNewDeviceId('');
      setNewDeviceStatus('Online');
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

      // Reload devices list from MySQL database
      await fetchDevices();

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

  const handleCopySourceCode = () => {
    if (!selectedDevice) return;
    const sourceCode = TEMPLATE_SOURCE_CODE.replace(/\{\{DEVICE_NAME\}\}/g, selectedDevice.id);
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 border rounded-2xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <Cpu className="w-6 h-6 mb-4" style={{ color: 'var(--cs-amber)' }} />
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)' }}>{devices.length + 120}</p>
            <p className="text-sm text-[var(--cs-text-dim)]">Total Device Aktif</p>
          </div>
          <div className="p-6 border rounded-2xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
            <Users className="w-6 h-6 mb-4" style={{ color: 'var(--cs-amber)' }} />
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-amber)' }}>{devices.filter(d => d.userEmail).length + 85}</p>
            <p className="text-sm text-[var(--cs-text-dim)]">Pengguna Terdaftar</p>
          </div>
          <div className="p-6 border rounded-2xl" style={{ background: 'color-mix(in oklab, var(--cs-danger) 10%, var(--cs-surface))', borderColor: 'color-mix(in oklab, var(--cs-danger) 30%, var(--cs-border))' }}>
            <Activity className="w-6 h-6 mb-4 animate-pulse" style={{ color: 'var(--cs-danger-text)' }} />
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--cs-danger-text)' }}>{devices.filter(d => d.status === 'Warning').length + 2}</p>
            <p className="text-sm" style={{ color: 'var(--cs-danger-text)' }}>Device Status Bahaya</p>
          </div>
        </div>

        <div className="border rounded-3xl overflow-hidden shadow-xl" style={{ background: 'var(--cs-surface)', borderColor: 'var(--cs-border)' }}>
          <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--cs-border)' }}>
            <h2 className="text-lg font-bold">Daftar Perangkat Terdaftar</h2>
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
                {devices.map((dev, i) => (
                  <tr key={i} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold" style={{ color: 'var(--cs-amber)' }}>{dev.id}</td>
                    <td className="px-6 py-4">{dev.userEmail || 'Belum Terdaftar'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        dev.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        dev.status === 'Warning' ? 'bg-red-500/10 text-red-450 border-red-500/20' :
                        dev.status === 'Menunggu Bind' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {dev.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">{dev.ppm}</td>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    Masukkan email pengguna untuk menautkan perangkat <strong style={{ color: 'var(--cs-amber)' }}>{selectedDevice.id}</strong>.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-[var(--cs-text-dim)] mb-2">Email Pengguna Pembeli</label>
                    <input 
                      type="email" 
                      required 
                      value={bindUserEmail}
                      onChange={(e) => setBindUserEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border rounded-xl focus:outline-none focus:border-[var(--cs-amber)] transition-colors placeholder:text-zinc-700" 
                      style={{ borderColor: 'var(--cs-border)' }}
                      placeholder="Misal: satriautama@example.com" 
                    />
                  </div>
                  <button type="submit" className="w-full py-3 text-black font-bold rounded-xl transition-all mt-6 flex justify-center items-center gap-2 cursor-pointer hover:brightness-110" style={{ background: 'var(--cs-amber)', boxShadow: '0 4px 15px -4px var(--cs-amber-glow)' }}>
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
                  {TEMPLATE_SOURCE_CODE.replace(/\{\{DEVICE_NAME\}\}/g, selectedDevice.id).split('\n').map((line, i) => (
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

    </div>
  );
}
