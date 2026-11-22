/**
 * CarbonSense Static Testing Site - Central Mock Data Store & Simulator
 * Bahasa Indonesia sederhana dan mudah dipahami untuk UMKM dan Rumah Tangga.
 * Tanpa backend, data tersimpan di browser (localStorage).
 */

const CS_KEYS = {
  USER: 'cs_mock_user',
  ADMIN: 'cs_mock_admin',
  DEVICES: 'cs_mock_devices',
  ACTIVE_DEVICE_ID: 'cs_mock_active_device_id',
  AI_PROFILE: 'cs_mock_ai_profile',
  ONBOARDING_DONE: 'cs_mock_onboarding_completed',
  SIMULATION_PPM: 'cs_mock_sim_ppm',
  SIMULATION_STATUS: 'cs_mock_sim_status', // 'Online' | 'Offline' | 'Warning' | 'Bahaya'
  LOGS: 'cs_mock_logs',
  SETTINGS: 'cs_mock_settings',
  EMERGENCY_CONTACTS: 'cs_mock_emergency_contacts',
  ALERT_LOGS: 'cs_mock_alert_logs',
  SIMPLE_MODE: 'cs_simple_mode'
};

const DEFAULT_EMERGENCY_CONTACTS = [
  {
    id: 'contact-1',
    name: 'Penanggung Jawab / Keluarga',
    phone: '+6285694813059'
  }
];

const DEFAULT_ALERT_LOGS = [
  {
    id: 'alert-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    formattedTime: '21:15',
    ppm: 1120,
    status: 'Selesai (Aman)',
    actionTaken: 'Ventilasi dibuka dalam 42 detik (kurang dari 1 menit)',
    channelUsed: 'WhatsApp (+6285694813059)',
    duration: '42 detik'
  }
];

const DEFAULT_DEVICES = [
  {
    id: 'CS-ESP32-LIVING-01',
    user: 'Salman Al-Farisi',
    userEmail: 'user@carbonsense.id',
    status: 'Online',
    ppm: 425,
    lastActive: 'Baru saja',
    location: 'Ruang Tamu / Keluarga',
    temp: 26.8,
    humidity: 58.2,
    voc: 110,
    firmware: 'v2.4.1-esp32'
  },
  {
    id: 'CS-ESP32-KITCHEN-02',
    user: 'Salman Al-Farisi',
    userEmail: 'user@carbonsense.id',
    status: 'Online',
    ppm: 640,
    lastActive: '1 menit lalu',
    location: 'Dapur / Tempat Memasak',
    temp: 29.1,
    humidity: 62.4,
    voc: 185,
    firmware: 'v2.4.1-esp32'
  },
  {
    id: 'CS-ESP32-BEDROOM-03',
    user: 'Salman Al-Farisi',
    userEmail: 'user@carbonsense.id',
    status: 'Warning',
    ppm: 880,
    lastActive: '5 menit lalu',
    location: 'Kamar Tidur',
    temp: 25.4,
    humidity: 65.0,
    voc: 240,
    firmware: 'v2.3.9-esp32'
  },
  {
    id: 'CS-ESP32-OFFICE-04',
    user: 'Budi Santoso',
    userEmail: 'budi@example.com',
    status: 'Offline',
    ppm: 0,
    lastActive: '2 jam lalu',
    location: 'Ruang Kerja / Usaha',
    temp: 27.0,
    humidity: 54.0,
    voc: 90,
    firmware: 'v2.4.0-esp32'
  }
];

const DEFAULT_PROFILE = {
  lokasi: 'Dapur / Tempat Memasak',
  sirkulasi: 'Jendela sering dibuka',
  kapasitas: '3-5 Orang',
  polutan: ['Kompor Gas / Tabung LPG'],
  luas_ruang: 'Sedang (10 - 25 m²)',
  detektor_lain: 'Belum ada',
  sensitivityMode: 'Standar Aman'
};

function generateInitialLogs() {
  const logs = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    let ppmVal = Math.floor(410 + Math.sin(i / 3) * 60 + Math.random() * 40);
    if (i === 4) ppmVal = 875;
    if (i === 3) ppmVal = 620;

    let status = 'Aman';
    let note = 'Kondisi udara normal';
    if (ppmVal >= 1000) {
      status = 'Bahaya';
      note = 'Peringatan kebocoran gas - alarm menyala';
    } else if (ppmVal >= 800) {
      status = 'Waspada';
      note = 'Buka ventilasi atau jendela segera';
    }

    logs.push({
      id: 'log-' + (24 - i),
      timestamp: time.toISOString(),
      formattedTime: time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      formattedDate: time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      ppm: ppmVal,
      temp: (26 + Math.random() * 3).toFixed(1),
      humidity: Math.floor(55 + Math.random() * 12),
      status: status,
      note: note
    });
  }
  return logs;
}

const MockStore = {
  init() {
    if (!localStorage.getItem(CS_KEYS.USER)) {
      localStorage.setItem(CS_KEYS.USER, JSON.stringify({
        username: 'Salman Al-Farisi',
        email: 'user@carbonsense.id',
        role: 'user',
        joinDate: '12 Januari 2026'
      }));
    }
    if (!localStorage.getItem(CS_KEYS.ADMIN)) {
      localStorage.setItem(CS_KEYS.ADMIN, JSON.stringify({
        username: 'Pengelola Sistem',
        email: 'admin@carbonsense.id',
        role: 'admin'
      }));
    }
    if (!localStorage.getItem(CS_KEYS.DEVICES)) {
      localStorage.setItem(CS_KEYS.DEVICES, JSON.stringify(DEFAULT_DEVICES));
    }
    if (!localStorage.getItem(CS_KEYS.ACTIVE_DEVICE_ID)) {
      localStorage.setItem(CS_KEYS.ACTIVE_DEVICE_ID, 'CS-ESP32-LIVING-01');
    }
    if (!localStorage.getItem(CS_KEYS.AI_PROFILE)) {
      localStorage.setItem(CS_KEYS.AI_PROFILE, JSON.stringify(DEFAULT_PROFILE));
    }
    if (!localStorage.getItem(CS_KEYS.ONBOARDING_DONE)) {
      localStorage.setItem(CS_KEYS.ONBOARDING_DONE, 'true');
    }
    if (!localStorage.getItem(CS_KEYS.SIMULATION_PPM)) {
      localStorage.setItem(CS_KEYS.SIMULATION_PPM, '425');
    }
    if (!localStorage.getItem(CS_KEYS.SIMULATION_STATUS)) {
      localStorage.setItem(CS_KEYS.SIMULATION_STATUS, 'Online');
    }
    if (!localStorage.getItem(CS_KEYS.LOGS)) {
      localStorage.setItem(CS_KEYS.LOGS, JSON.stringify(generateInitialLogs()));
    }
    if (!localStorage.getItem(CS_KEYS.EMERGENCY_CONTACTS)) {
      localStorage.setItem(CS_KEYS.EMERGENCY_CONTACTS, JSON.stringify(DEFAULT_EMERGENCY_CONTACTS));
    }
    if (!localStorage.getItem(CS_KEYS.ALERT_LOGS)) {
      localStorage.setItem(CS_KEYS.ALERT_LOGS, JSON.stringify(DEFAULT_ALERT_LOGS));
    }
  },

  getEmergencyContacts() {
    try {
      const data = JSON.parse(localStorage.getItem(CS_KEYS.EMERGENCY_CONTACTS) || '[]');
      if (Array.isArray(data) && data.length > 0) return data;
      return DEFAULT_EMERGENCY_CONTACTS;
    } catch {
      return DEFAULT_EMERGENCY_CONTACTS;
    }
  },

  saveEmergencyContacts(contacts) {
    if (!Array.isArray(contacts)) contacts = [contacts];
    localStorage.setItem(CS_KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
  },

  addEmergencyContact(name, phone) {
    const list = this.getEmergencyContacts();
    const newContact = {
      id: 'contact-' + Date.now(),
      name: name || 'Kontak Tambahan',
      phone: phone || '+6285694813059'
    };
    list.push(newContact);
    this.saveEmergencyContacts(list);
    return newContact;
  },

  removeEmergencyContact(id) {
    let list = this.getEmergencyContacts();
    list = list.filter(c => c.id !== id);
    if (list.length === 0) {
      list = DEFAULT_EMERGENCY_CONTACTS;
    }
    this.saveEmergencyContacts(list);
    return list;
  },

  getAlertLogs() {
    try {
      return JSON.parse(localStorage.getItem(CS_KEYS.ALERT_LOGS) || '[]');
    } catch {
      return [];
    }
  },

  addAlertLog(entry) {
    const logs = this.getAlertLogs();
    const newEntry = {
      id: 'alert-' + Date.now(),
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...entry
    };
    logs.unshift(newEntry);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(CS_KEYS.ALERT_LOGS, JSON.stringify(logs));
    return newEntry;
  },

  generateWhatsAppLink(phone, message) {
    const cleanPhone = (phone || '+6285694813059').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(CS_KEYS.USER) || 'null');
    } catch {
      return null;
    }
  },

  setUser(userObj) {
    localStorage.setItem(CS_KEYS.USER, JSON.stringify(userObj));
  },

  logoutUser() {
    localStorage.removeItem(CS_KEYS.USER);
    localStorage.removeItem(CS_KEYS.ONBOARDING_DONE);
  },

  getAdmin() {
    try {
      return JSON.parse(localStorage.getItem(CS_KEYS.ADMIN) || 'null');
    } catch {
      return null;
    }
  },

  getDevices() {
    try {
      return JSON.parse(localStorage.getItem(CS_KEYS.DEVICES) || '[]');
    } catch {
      return [];
    }
  },

  saveDevices(devs) {
    localStorage.setItem(CS_KEYS.DEVICES, JSON.stringify(devs));
  },

  getActiveDeviceId() {
    return localStorage.getItem(CS_KEYS.ACTIVE_DEVICE_ID) || 'CS-ESP32-LIVING-01';
  },

  setActiveDeviceId(id) {
    localStorage.setItem(CS_KEYS.ACTIVE_DEVICE_ID, id);
  },

  getActiveDevice() {
    const devices = this.getDevices();
    const activeId = this.getActiveDeviceId();
    const found = devices.find(d => d.id === activeId);
    return found || devices[0] || null;
  },

  getProfile() {
    try {
      return JSON.parse(localStorage.getItem(CS_KEYS.AI_PROFILE) || JSON.stringify(DEFAULT_PROFILE));
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(prof) {
    localStorage.setItem(CS_KEYS.AI_PROFILE, JSON.stringify(prof));
  },

  isOnboardingDone() {
    return localStorage.getItem(CS_KEYS.ONBOARDING_DONE) === 'true';
  },

  setOnboardingDone(val) {
    localStorage.setItem(CS_KEYS.ONBOARDING_DONE, val ? 'true' : 'false');
  },

  getSimPpm() {
    return parseInt(localStorage.getItem(CS_KEYS.SIMULATION_PPM) || '425', 10);
  },

  setSimPpm(ppm) {
    localStorage.setItem(CS_KEYS.SIMULATION_PPM, ppm.toString());
    this.appendLog(ppm);
  },

  getSimStatus() {
    return localStorage.getItem(CS_KEYS.SIMULATION_STATUS) || 'Online';
  },

  setSimStatus(status) {
    localStorage.setItem(CS_KEYS.SIMULATION_STATUS, status);
  },

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(CS_KEYS.LOGS) || '[]');
    } catch {
      return [];
    }
  },

  appendLog(ppm) {
    const logs = this.getLogs();
    const now = new Date();
    let status = 'Aman';
    let note = 'Kondisi udara normal';
    if (ppm >= 1000) {
      status = 'Bahaya';
      note = 'Peringatan Bahaya Gas!';
    } else if (ppm >= 800) {
      status = 'Waspada';
      note = 'Kadar gas mulai naik';
    }

    logs.push({
      id: 'log-' + Date.now(),
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      formattedDate: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      ppm: ppm,
      temp: (26 + Math.random() * 2).toFixed(1),
      humidity: Math.floor(58 + Math.random() * 6),
      status: status,
      note: note
    });

    if (logs.length > 50) logs.shift();
    localStorage.setItem(CS_KEYS.LOGS, JSON.stringify(logs));
  },

  generateDynamicSummary(answers) {
    const lokasi = answers.find(a => a.id === 'lokasi')?.value || 'Ruangan';
    const sirkulasi = answers.find(a => a.id === 'sirkulasi')?.value || 'sirkulasi udara standar';
    const kapasitas = answers.find(a => a.id === 'kapasitas')?.value || '1-2 Orang';
    const polutan = answers.find(a => a.id === 'polutan')?.value || 'Tidak Ada';
    const luas = answers.find(a => a.id === 'luas_ruang')?.value || 'Sedang';

    let summary = `Alat pendeteksi dipasang di **${lokasi}** dengan perkiraan luas **${luas}**. `;

    if (sirkulasi.toLowerCase().includes('tertutup') || sirkulasi.toLowerCase().includes('ac')) {
      summary += `Karena kondisi ruangan **${sirkulasi}**, udara dapat tertahan lebih lama jika ada asap atau kebocoran gas. `;
    } else {
      summary += `Dengan kondisi ventilasi **${sirkulasi}**, pergantian udara segar cukup lancar untuk aktivitas bersama **${kapasitas}**. `;
    }

    if (polutan && polutan !== 'Tidak Ada') {
      summary += `Ada potensi sumber gas dari **${polutan}**, sehingga sistem akan terus siaga memberi tahu jika tercium gas atau ada asap pekat. `;
    } else {
      summary += `Tidak ada sumber gas atau asap rutin di sekitar alat. `;
    }

    summary += `Sistem telah siap bekerja otomatis untuk menjaga keselamatan keluarga dan usaha Anda.`;
    return summary;
  },

  getAiAdvice(ppm, profile = null) {
    const prof = profile || this.getProfile();

    if (ppm < 600) {
      return {
        level: 'Normal',
        title: 'Kualitas Udara Bersih & Aman',
        text: `Kadar gas saat ini ${ppm} PPM (sangat aman). Sirkulasi di ${prof.lokasi || 'ruangan'} berjalan baik dan tidak ada tanda bahaya.`,
        badgeClass: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
      };
    } else if (ppm < 1000) {
      return {
        level: 'Waspada',
        title: 'Perhatian: Kadar Gas Mulai Meningkat',
        text: `Kadar gas mencapai ${ppm} PPM. Sebaiknya segera buka jendela atau nyalakan kipas/exhaust agar udara segar lekas masuk.`,
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      };
    } else {
      return {
        level: 'Bahaya',
        title: 'PERINGATAN BAHAYA: KEBOCORAN GAS!',
        text: `Kadar gas sangat tinggi (${ppm} PPM)! Segera matikan kompor dan lepas regulator tabung gas, buka semua jendela dan pintu, serta ajak semua orang keluar ruangan sekarang!`,
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
      };
    }
  },

  askAiAssistant(question, currentPpm) {
    const q = question.toLowerCase();
    const prof = this.getProfile();

    if (q.includes('turunkan') || q.includes('cara') || q.includes('bantuan') || q.includes('mitigasi')) {
      return `Langkah mudah menurunkan gas (${currentPpm} PPM) di ${prof.lokasi || 'ruangan'}:
1. Segera buka lebar-lebar pintu dan jendela.
2. Nyalakan kipas angin atau exhaust fan mengarah ke luar.
3. Periksa kompor dan pastikan regulator tabung gas tidak bocor atau terlepas.
4. Jangan menyalakan korek api atau saklar listrik sampai bau gas benar-benar hilang.`;
    }
    if (q.includes('keluar') || q.includes('evakuasi') || q.includes('bahaya')) {
      return `Batas bahaya utama adalah jika angka gas mencapai 1000 PPM atau lebih. Jika sirene berbunyi, segera tinggalkan ruangan dan ajak semua orang menjauh ke tempat terbuka yang aman.`;
    }
    if (q.includes('alat') || q.includes('sensor') || q.includes('lampu')) {
      return `Alat pendeteksi CarbonSense membaca kadar gas setiap detik. Jika lampu atau bunyi alarm menyala, sistem akan otomatis mengirim pesan darurat ke kontak WhatsApp yang Anda daftarkan.`;
    }

    return `Saat ini alat di ${prof.lokasi || 'ruangan'} membaca kadar gas sebesar ${currentPpm} PPM (kondisi terpantau aman). Ada hal lain seputar keselamatan udara yang ingin Anda tanyakan?`;
  },

  // ---- Simple Mode ----
  isSimpleMode() {
    return localStorage.getItem(CS_KEYS.SIMPLE_MODE) === 'true';
  },
  setSimpleMode(val) {
    localStorage.setItem(CS_KEYS.SIMPLE_MODE, val ? 'true' : 'false');
  },

  resetAll() {
    localStorage.clear();
    this.init();
  }
};

MockStore.init();
window.MockStore = MockStore;
