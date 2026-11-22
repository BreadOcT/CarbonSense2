/**
 * CarbonSense Floating Testing Navigator HUD
 * Bahasa sederhana, tanpa emoji pada antarmuka pengguna (UI).
 * Memudahkan pengujian antar halaman dan simulasi gas.
 */

(function () {
  // Bersihkan state mode terang lama agar tidak menimpa palet warna baru
  localStorage.removeItem('cs_theme');
  document.documentElement.classList.remove('light-mode');
  if (document.body) {
    document.body.classList.remove('light-mode');
  }

  function createTestingHud() {
    if (document.getElementById('testing-hud-root')) return;

    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    const hudWrapper = document.createElement('div');
    hudWrapper.id = 'testing-hud-root';
    hudWrapper.innerHTML = `
      <style>
        #testing-hud-pill {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0284C7;
          color: #FFFFFF;
          border: 1px solid #0284C7;
          padding: 10px 18px;
          border-radius: 9999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.35);
          transition: all 0.2s ease;
        }
        #testing-hud-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -4px rgba(2, 132, 199, 0.45);
          background: #0369A1;
        }
        @media (max-width: 640px) {
          #testing-hud-pill {
            bottom: 12px;
            right: 12px;
            padding: 7px 13px;
            font-size: 11px;
          }
          #testing-hud-panel {
            bottom: 56px;
            right: 12px;
            width: calc(100vw - 24px);
            max-width: 350px;
          }
        }
        #testing-hud-panel {
          position: fixed;
          bottom: 74px;
          right: 20px;
          width: 380px;
          max-width: calc(100vw - 40px);
          max-height: 80vh;
          overflow-y: auto;
          z-index: 999999;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 18px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.06);
          color: #0F172A;
          font-family: 'DM Sans', sans-serif;
          display: none;
          flex-direction: column;
        }
        #testing-hud-panel.open {
          display: flex;
        }
        .hud-header {
          padding: 14px 18px;
          background: #F0F9FF;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #0F172A;
        }
        .hud-section {
          padding: 14px 18px;
          border-bottom: 1px solid #E2E8F0;
        }
        .hud-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #475569;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .hud-btn {
          font-size: 12px;
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #0F172A;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .hud-btn:hover {
          background: #F0F9FF;
          border-color: #0284C7;
          color: #0284C7;
        }
        .hud-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 8px;
          color: #475569;
          text-decoration: none;
          font-size: 13px;
          transition: all 0.15s;
        }
        .hud-link:hover, .hud-link.active {
          background: #E0F2FE;
          color: #0284C7;
          font-weight: 700;
        }
        .hud-link.active::after {
          content: 'Aktif';
          font-size: 10px;
          font-weight: bold;
          color: #16A34A;
          background: #DCFCE7;
          padding: 2px 6px;
          border-radius: 4px;
        }
      </style>

      <button id="testing-hud-pill" title="Buka Panel Pengujian">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Panel Pengujian</span>
      </button>

      <div id="testing-hud-panel">
        <div class="hud-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#16A34A;"></span>
            <strong style="font-size:14px; letter-spacing:0.02em; color:#0F172A;">Panel Pengujian Web</strong>
          </div>
          <button id="testing-hud-close" style="background:transparent; border:none; color:#475569; font-size:18px; cursor:pointer;">&times;</button>
        </div>

        <!-- UI Simple Mode Switcher -->
        <div class="hud-section" style="display:flex; align-items:center; justify-content:space-between; background:#F0F9FF;">
          <div>
            <div style="font-size:12px; font-weight:700; color:#0284C7;">Mode Tampilan UI</div>
            <div style="font-size:11px; color:#475569;">Sederhana (Ibu RT) vs Detail</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="hud-btn" id="hud-ui-simple" style="padding:5px 10px; font-size:11px; font-weight:bold;">
              Simpel
            </button>
            <button class="hud-btn" id="hud-ui-normal" style="padding:5px 10px; font-size:11px; font-weight:bold;">
              Detail
            </button>
          </div>
        </div>

        <!-- Telemetry Simulation -->
        <div class="hud-section">
          <div class="hud-title">Simulasi Kadar Gas (PPM)</div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
            <span style="font-size:13px; color:#475569;">Nilai Terbaca:</span>
            <span id="hud-ppm-display" style="font-size:16px; font-weight:700; color:#0284C7; font-family:'Bebas Neue', sans-serif; letter-spacing:1px;">
              ${window.MockStore ? window.MockStore.getSimPpm() : 425} PPM
            </span>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:10px;">
            <button class="hud-btn" id="hud-sim-normal" style="justify-content:center; border-color:rgba(22,163,74,0.4); color:#16A34A; background:#DCFCE7;">
              Aman (425)
            </button>
            <button class="hud-btn" id="hud-sim-warning" style="justify-content:center; border-color:rgba(234,88,12,0.4); color:#EA580C; background:#FFEDD5;">
              Waspada (850)
            </button>
            <button class="hud-btn" id="hud-sim-danger" style="justify-content:center; border-color:rgba(220,38,38,0.4); color:#DC2626; background:#FEE2E2;">
              Bahaya (1250)
            </button>
          </div>

          <div style="display:flex; gap:6px;">
            <button class="hud-btn" id="hud-sim-toggle-conn" style="flex:1; justify-content:center;">
              Ganti Status Alat (Online / Offline)
            </button>
          </div>
        </div>

        <!-- Page Navigator -->
        <div class="hud-section">
          <div class="hud-title">Daftar Halaman</div>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <a href="guide.html" class="hud-link ${pageName === 'guide.html' ? 'active' : ''}">
              <span style="font-weight:bold; color:#0284C7;">Panduan Pengujian</span>
            </a>
            <a href="index.html" class="hud-link ${pageName === 'index.html' ? 'active' : ''}">
              <span>1. Halaman Awal (Beranda)</span>
            </a>
            <a href="login.html" class="hud-link ${pageName === 'login.html' ? 'active' : ''}">
              <span>2. Masuk Akun Pengguna</span>
            </a>
            <a href="register.html" class="hud-link ${pageName === 'register.html' ? 'active' : ''}">
              <span>3. Daftar Akun Baru</span>
            </a>
            <a href="onboarding.html" class="hud-link ${pageName === 'onboarding.html' ? 'active' : ''}">
              <span>4. Pengaturan Awal Ruangan & WA</span>
            </a>
            <a href="select-device.html" class="hud-link ${pageName === 'select-device.html' ? 'active' : ''}">
              <span>5. Hubungkan Alat Pendeteksi</span>
            </a>
            <a href="dashboard.html" class="hud-link ${pageName === 'dashboard.html' ? 'active' : ''}">
              <span>6. Halaman Pemantauan (Dashboard)</span>
            </a>
            <a href="settings.html" class="hud-link ${pageName === 'settings.html' ? 'active' : ''}">
              <span>7. Pengaturan & Kontak WhatsApp</span>
            </a>
            <a href="profile.html" class="hud-link ${pageName === 'profile.html' ? 'active' : ''}">
              <span>8. Profil Pengguna</span>
            </a>
            <a href="admin-login.html" class="hud-link ${pageName === 'admin-login.html' ? 'active' : ''}">
              <span>9. Masuk Administrator</span>
            </a>
            <a href="admin-dashboard.html" class="hud-link ${pageName === 'admin-dashboard.html' ? 'active' : ''}">
              <span>10. Pengelolaan Alat (Admin)</span>
            </a>
          </div>
        </div>

        <!-- Quick Scenarios -->
        <div class="hud-section">
          <div class="hud-title">Simulasi Cepat</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <button class="hud-btn" id="hud-sim-bpmn" style="width:100%; border-color:rgba(220,38,38,0.4); color:#DC2626; background:#FEE2E2;">
              Uji Alarm Bahaya & Kirim WhatsApp
            </button>
            <button class="hud-btn" id="hud-reset-guest" style="width:100%;">
              Ulangi Pengaturan Awal (Onboarding)
            </button>
            <button class="hud-btn" id="hud-reset-all" style="width:100%; color:#DC2626; border-color:rgba(220,38,38,0.3);">
              Reset Ulang Semua Data Pengujian
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(hudWrapper);

    const pill = document.getElementById('testing-hud-pill');
    const panel = document.getElementById('testing-hud-panel');
    const closeBtn = document.getElementById('testing-hud-close');
    const ppmDisplay = document.getElementById('hud-ppm-display');

    pill.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });

    function updateSimpleButtonsUI() {
      const isSimple = window.MockStore && window.MockStore.isSimpleMode();
      const btnSimple = document.getElementById('hud-ui-simple');
      const btnNormal = document.getElementById('hud-ui-normal');
      if (btnSimple && btnNormal) {
        if (isSimple) {
          btnSimple.style.background = '#16A34A';
          btnSimple.style.color = '#FFFFFF';
          btnSimple.style.borderColor = '#16A34A';
          btnNormal.style.background = '#FFFFFF';
          btnNormal.style.color = '#475569';
          btnNormal.style.borderColor = '#CBD5E1';
        } else {
          btnNormal.style.background = '#0284C7';
          btnNormal.style.color = '#FFFFFF';
          btnNormal.style.borderColor = '#0284C7';
          btnSimple.style.background = '#FFFFFF';
          btnSimple.style.color = '#475569';
          btnSimple.style.borderColor = '#CBD5E1';
        }
      }
    }

    document.getElementById('hud-ui-simple').addEventListener('click', () => {
      if (window.MockStore) {
        window.MockStore.setSimpleMode(true);
        window.location.reload();
      }
    });

    document.getElementById('hud-ui-normal').addEventListener('click', () => {
      if (window.MockStore) {
        window.MockStore.setSimpleMode(false);
        window.location.reload();
      }
    });

    updateSimpleButtonsUI();

    function updatePpmAndRefresh(val) {
      if (window.MockStore) {
        window.MockStore.setSimPpm(val);
      }
      if (ppmDisplay) {
        ppmDisplay.textContent = val + ' PPM';
      }
        if (window.setSimValue) {
          window.setSimValue(val);
        } else if (window.onTelemetryUpdate) {
          window.onTelemetryUpdate(val);
        } else if (window.updateLiveTelemetryUI) {
          window.updateLiveTelemetryUI(val);
        }
      }

      document.getElementById('hud-sim-normal').addEventListener('click', () => {
        updatePpmAndRefresh(425);
      });

      document.getElementById('hud-sim-warning').addEventListener('click', () => {
        updatePpmAndRefresh(850);
      });

      document.getElementById('hud-sim-danger').addEventListener('click', () => {
        updatePpmAndRefresh(1250);
      });

      document.getElementById('hud-sim-toggle-conn').addEventListener('click', () => {
        if (!window.MockStore) return;
        const cur = window.MockStore.getSimStatus();
        const next = cur === 'Online' ? 'Offline' : 'Online';
        window.MockStore.setSimStatus(next);
        alert('Status alat berhasil diubah menjadi: ' + next);
        if (window.updateDeviceStatusUI) {
          window.updateDeviceStatusUI(next);
        } else {
          window.location.reload();
        }
      });

      document.getElementById('hud-sim-bpmn').addEventListener('click', () => {
        if (window.triggerHazardAlarm) {
          panel.classList.remove('open');
          window.triggerHazardAlarm(1280);
        } else {
          window.location.href = 'dashboard.html?trigger_alarm=true';
        }
      });

      document.getElementById('hud-reset-guest').addEventListener('click', () => {
        if (window.MockStore) {
          window.MockStore.setOnboardingDone(false);
        }
        window.location.href = 'onboarding.html';
      });

      document.getElementById('hud-reset-all').addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mengatur ulang semua data simulasi ke awal?')) {
          if (window.MockStore) {
            window.MockStore.resetAll();
          }
          alert('Data berhasil diatur ulang.');
          window.location.href = 'index.html';
        }
      });
    }

    function init() {
      document.documentElement.classList.remove('light-mode');
      if (document.body) {
        document.body.classList.remove('light-mode');
      }
      createTestingHud();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }) ();
