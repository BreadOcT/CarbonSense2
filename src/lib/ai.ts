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
export function generateSimpleAdvice(profile: AIProfile | null, carbonLevel: number | null): string {
  if (!profile) {
    return "Silakan lengkapi profil onboarding untuk mendapatkan rekomendasi personal dari CarbonSense AI.";
  }
  const location = profile.lokasi || "Ruangan";
  const currentPpm = carbonLevel;

  if (currentPpm && currentPpm > 1200) {
    return `Peringatan Kritis! Kadar CO di ${location} terdeteksi sangat tinggi (${currentPpm} ppm). Lakukan protokol evakuasi darurat segera!`;
  } else if (currentPpm && currentPpm > 700) {
    return `Kondisi Waspada! Kadar CO di ${location} meningkat (${currentPpm} ppm). Disarankan membuka jendela untuk sirkulasi udara segar.`;
  }
  return `Kondisi udara di ${location} terpantau normal (${currentPpm || 0} ppm). Kualitas udara terjaga dengan baik.`;
}

/**
 * Generates Indonesian replies. Only contacts DeepSeek via backend proxy if PPM is > 1200.
 */
export async function generateChatResponse(
  questionText: string,
  profile: AIProfile | null,
  carbonLevel: number | null
): Promise<string> {
  const currentPpm = carbonLevel || 450;

  // Always attempt to get a recommendation from DeepSeek AI
  try {
    // Dynamic import to avoid circular references at runtime
    const { api } = await import('./api');
    const response = await api.ai.getRecommendation({
      question: questionText,
      profile,
      carbonLevel: currentPpm
    });
    return response;
  } catch (err: any) {
    console.error('Failed to get real DeepSeek recommendation:', err);
    // Fallback to rules below if the API key is not configured or fails
  }

  // Local Rule-Based Responses for PPM <= 1200
  const lokasi = profile?.lokasi || "Ruangan";
  const sirkulasi = profile?.sirkulasi || "Sirkulasi Udara";
  const kapasitas = profile?.kapasitas || "1-2 Orang";
  const polutan = profile?.polutan && profile.polutan.length > 0 ? profile.polutan.join(', ') : "Tidak Ada";
  const rentan = profile?.rentan || "Tidak Ada";
  const luas = profile?.luas_ruang || "Sedang";
  const detektor = profile?.detektor_lain || "Tidak Ada";

  const lowCaseText = questionText.toLowerCase();

  if (lowCaseText.includes("status") || lowCaseText.includes("kualitas") || lowCaseText.includes("bagaimana")) {
    if (currentPpm <= 700) {
      return `Kadar karbon di **${lokasi}** saat ini **${currentPpm} ppm** (Aman). Sirkulasi ${sirkulasi} dan ukuran ruangan ${luas} dalam kondisi stabil.`;
    } else {
      return `Kadar karbon di **${lokasi}** saat ini **${currentPpm} ppm** (Waspada). Segera buka jendela untuk meningkatkan sirkulasi ${sirkulasi} dan mengurangi pengaruh emisi ${polutan}.`;
    }
  } else if (lowCaseText.includes("rentan") || lowCaseText.includes("bayi") || lowCaseText.includes("lansia") || lowCaseText.includes("asma")) {
    if (rentan !== "Tidak Ada" && rentan !== "Tidak ada" && rentan !== "") {
      return `Terdaftar kelompok rentan: **${rentan}**. Paparan CO di atas 700 ppm sangat berbahaya bagi kelompok ini. Prioritaskan evakuasi cepat jika alarm aktif.`;
    } else {
      return `Tidak ada kelompok rentan terdaftar. Namun, kadar CO di atas 1000 ppm tetap berbahaya bagi pernapasan jika terpapar terus-menerus.`;
    }
  } else if (lowCaseText.includes("evakuasi") || lowCaseText.includes("tindakan") || lowCaseText.includes("bocor") || lowCaseText.includes("bencana")) {
    return `Prosedur keselamatan darurat di **${lokasi}**:
a. **Evakuasi**: Segera pindahkan ${rentan !== 'Tidak Ada' && rentan !== 'Tidak ada' && rentan !== '' ? `${rentan} dan seluruh penghuni` : 'seluruh penghuni'} ke luar ruangan.
b. **Sirkulasi**: Buka semua pintu/jendela lebar-lebar. Matikan AC.
c. **Sumber Gas**: Matikan kompor atau sumber emisi gas terdekat (${polutan}).
d. **Keamanan**: Andalkan monitor ini dan tunggu hingga kadar CO di bawah 700 PPM sebelum masuk kembali.`;
  } else if (lowCaseText.includes("luas") || lowCaseText.includes("ventilasi") || lowCaseText.includes("dimensi")) {
    return `Konfigurasi **${lokasi}**: Ukuran **${luas}**, sirkulasi **${sirkulasi}**, kapasitas **${kapasitas}** orang. Ruangan kecil tertutup mempercepat akumulasi karbon.`;
  }

  // General fallback
  return `Kadar CO saat ini **${currentPpm} ppm** di **${lokasi}** (${luas}, sirkulasi: ${sirkulasi}). Silakan tanyakan status udara, kelompok rentan, atau prosedur evakuasi secara spesifik.`;
}
