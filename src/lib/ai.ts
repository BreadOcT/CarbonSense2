/**
 * CarbonSense AI Assistant Engine
 * Handles Indonesian recommendations, interactive Q&A response generation,
 * and evacuation protocol construction based on environmental profile and live telemetry.
 */

export interface AIProfile {
  lokasi: string;
  sirkulasi: string;
  kapasitas: string;
  polutan: string[];
  rentan: string;
  luas_ruang: string;
  detektor_lain: string;
}

/**
 * Generates a brief recommendation text for headers or alerts.
 */
export function generateSimpleAdvice(profile: AIProfile | null, carbonLevel: number | null, isOffline: boolean): string {
  if (!profile) {
    return "Silakan lengkapi profil onboarding untuk mendapatkan rekomendasi personal dari CarbonSense AI.";
  }
  const location = profile.lokasi || "Ruangan";

  if (isOffline || carbonLevel === null) {
    return `Alat pemantau di ${location} sedang offline. Hubungkan perangkat ke WiFi & daya untuk melihat kadar karbon secara real-time.`;
  }

  const currentPpm = carbonLevel;

  if (currentPpm > 1200) {
    return `Peringatan Kritis! Kadar CO di ${location} terdeteksi sangat tinggi (${currentPpm} ppm). Lakukan protokol evakuasi darurat segera!`;
  } else if (currentPpm > 700) {
    return `Kondisi Waspada! Kadar CO di ${location} meningkat (${currentPpm} ppm). Disarankan membuka jendela untuk sirkulasi udara segar.`;
  }
  return `Kondisi udara di ${location} terpantau normal (${currentPpm} ppm). Kualitas udara terjaga dengan baik.`;
}

/**
 * Generates Indonesian replies. Contacts DeepSeek via backend proxy.
 */
export async function generateChatResponse(
  questionText: string,
  profile: AIProfile | null,
  carbonLevel: number | null,
  isOffline: boolean,
  chatHistory: any[]
): Promise<string> {
  const currentPpm = isOffline ? null : (carbonLevel || 450);

  // Always attempt to get a recommendation from DeepSeek AI
  let aiErrorReason = '';
  try {
    // Dynamic import to avoid circular references at runtime
    const { api } = await import('./api');
    const response = await api.ai.getRecommendation({
      question: questionText,
      profile,
      carbonLevel: currentPpm,
      isOffline,
      chatHistory
    });
    return response;
  } catch (err: any) {
    console.error('Failed to get real DeepSeek recommendation:', err);
    aiErrorReason = err?.message || 'Koneksi ke server AI gagal';
    // Fallback to rules below if the API key is not configured or fails
  }

  const fallbackNotice = `\n\n_(Mode Cadangan — DeepSeek AI belum aktif: ${aiErrorReason})_`;

  // Local Rule-Based Responses for Offline or Low/Normal PPM
  const lokasi = profile?.lokasi || "Ruangan";
  const sirkulasi = profile?.sirkulasi || "Sirkulasi Udara";
  const kapasitas = profile?.kapasitas || "1-2 Orang";
  const polutan = profile?.polutan && profile.polutan.length > 0 ? profile.polutan.join(', ') : "Tidak Ada";
  const rentan = profile?.rentan || "Tidak Ada";
  const luas = profile?.luas_ruang || "Sedang";

  const lowCaseText = questionText.toLowerCase();

  // If device is offline, block telemetry answers and guide user to turn it on
  if (isOffline) {
    if (lowCaseText.includes("nyala") || lowCaseText.includes("aktif") || lowCaseText.includes("hidup") || lowCaseText.includes("cara")) {
      return `Berikut adalah langkah menyalakan perangkat CarbonSense dari awal hingga akhir:
a. **Catu Daya**: Hubungkan papan ESP32 ke listrik menggunakan kabel Micro-USB atau USB-C.
b. **WiFi Hotspot**: Hubungkan HP/Laptop Anda ke WiFi "CarbonSense-AP". Portal pendaftaran WiFi akan terbuka secara otomatis di browser.
c. **Pengaturan WiFi**: Masukkan SSID dan password WiFi rumah Anda pada portal. Perangkat akan me-reboot dan terhubung ke WiFi rumah secara mandiri.
d. **Pre-heating (Pemanasan)**: Sensor memerlukan waktu 1-2 menit untuk kalibrasi awal sebelum data PPM stabil dikirim ke database.
e. **Bind Device**: Daftarkan ID perangkat Anda (misal: CS-DAPUR-01) pada menu "Pilih Perangkat" di website CarbonSense agar tersinkronisasi.`;
    }
    return `Perangkat CarbonSense di **${lokasi}** saat ini sedang **Offline**. 
Untuk mengetahui status udara secara real-time, harap pastikan alat Anda menyala dan terhubung ke WiFi. 
Langkah menyalakan alat:
a. Colokkan kabel daya ke alat ESP32.
b. Pastikan alat terhubung ke internet.
c. Tautkan ID alat Anda di halaman Pilih Perangkat.`;
  }

  if (lowCaseText.includes("nyala") || lowCaseText.includes("aktif") || lowCaseText.includes("hidup") || lowCaseText.includes("cara")) {
    return `Berikut adalah langkah menyalakan perangkat CarbonSense dari awal hingga akhir:
a. **Catu Daya**: Hubungkan papan ESP32 ke listrik menggunakan kabel Micro-USB atau USB-C.
b. **WiFi Hotspot**: Hubungkan HP/Laptop Anda ke WiFi "CarbonSense-AP". Portal pendaftaran WiFi akan terbuka secara otomatis di browser.
c. **Pengaturan WiFi**: Masukkan SSID dan password WiFi rumah Anda pada portal. Perangkat akan me-reboot dan terhubung ke WiFi rumah secara mandiri.
d. **Pre-heating (Pemanasan)**: Sensor memerlukan waktu 1-2 menit untuk kalibrasi awal sebelum data PPM stabil dikirim ke database.
e. **Bind Device**: Daftarkan ID perangkat Anda (misal: CS-DAPUR-01) pada menu "Pilih Perangkat" di website CarbonSense agar tersinkronisasi.`;
  }

  if (lowCaseText.includes("status") || lowCaseText.includes("kualitas") || lowCaseText.includes("bagaimana") || lowCaseText.includes("ppm")) {
    if (currentPpm !== null && currentPpm <= 700) {
      return `Kadar karbon di **${lokasi}** saat ini **${currentPpm} ppm** (Aman). Sirkulasi ${sirkulasi} dan ukuran ruangan ${luas} dalam kondisi stabil.${fallbackNotice}`;
    } else {
      return `Kadar karbon di **${lokasi}** saat ini **${currentPpm} ppm** (Waspada). Segera buka jendela untuk meningkatkan sirkulasi ${sirkulasi} dan mengurangi pengaruh emisi ${polutan}.${fallbackNotice}`;
    }
  } else if (lowCaseText.includes("rentan") || lowCaseText.includes("bayi") || lowCaseText.includes("lansia") || lowCaseText.includes("asma")) {
    if (rentan !== "Tidak Ada" && rentan !== "Tidak ada" && rentan !== "") {
      return `Terdaftar kelompok rentan: **${rentan}**. Paparan CO di atas 700 ppm sangat berbahaya bagi kelompok ini. Prioritaskan evakuasi cepat jika alarm aktif.${fallbackNotice}`;
    } else {
      return `Tidak ada kelompok rentan terdaftar. Namun, kadar CO di atas 1000 ppm tetap berbahaya bagi pernapasan jika terpapar terus-menerus.${fallbackNotice}`;
    }
  } else if (lowCaseText.includes("evakuasi") || lowCaseText.includes("tindakan") || lowCaseText.includes("bocor") || lowCaseText.includes("bencana")) {
    return `Prosedur keselamatan darurat di **${lokasi}**:
a. **Evakuasi**: Segera pindahkan ${rentan !== 'Tidak Ada' && rentan !== 'Tidak ada' && rentan !== '' ? `${rentan} dan seluruh penghuni` : 'seluruh penghuni'} ke luar ruangan.
b. **Sirkulasi**: Buka semua pintu/jendela lebar-lebar. Matikan AC.
c. **Sumber Gas**: Matikan kompor atau sumber emisi gas terdekat (${polutan}).
d. **Keamanan**: Andalkan monitor ini dan tunggu hingga kadar CO di bawah 700 PPM sebelum masuk kembali.${fallbackNotice}`;
  } else if (lowCaseText.includes("luas") || lowCaseText.includes("ventilasi") || lowCaseText.includes("dimensi")) {
    return `Konfigurasi **${lokasi}**: Ukuran **${luas}**, sirkulasi **${sirkulasi}**, kapasitas **${kapasitas}** orang. Ruangan kecil tertutup mempercepat akumulasi karbon.${fallbackNotice}`;
  }

  // General fallback
  return `Kadar CO saat ini **${currentPpm} ppm** di **${lokasi}** (${luas}, sirkulasi: ${sirkulasi}). Silakan tanyakan status udara, kelompok rentan, atau prosedur evakuasi secara spesifik.${fallbackNotice}`;
}
