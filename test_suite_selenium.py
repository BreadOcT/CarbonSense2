# test_suite_selenium.py
# Automated Test Suite for CarbonSense using Selenium Python (pytest format)

import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"

class TestCarbonSense:

    def setup_method(self, method):
        # Inisialisasi WebDriver Chrome
        self.driver = webdriver.Chrome()
        self.driver.implicitly_wait(5)
        self.vars = {}

    def teardown_method(self, method):
        # Tutup WebDriver setelah pengujian selesai
        self.driver.quit()

    # ==========================================
    # 1. PENGUJIAN USER LOGIN (TC 1.1 - 1.3)
    # ==========================================

    def test_tc_1_1_login_empty(self):
        # Skenario: Login dengan kolom email & password kosong
        self.driver.get(f"{BASE_URL}/login")
        self.driver.set_window_size(1280, 800)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        # Verifikasi input kosong diblokir (tidak dialihkan halaman)
        assert "login" in self.driver.current_url

    def test_tc_1_2_login_failed(self):
        # Skenario: Login dengan password salah
        self.driver.get(f"{BASE_URL}/login")
        self.driver.set_window_size(1280, 800)
        self.driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("okto@gmail.com")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("salahpassword")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Tunggu kemunculan box alert error
        time.sleep(1)
        error_box = self.driver.find_element(By.CSS_SELECTOR, "div.border-red-500")
        assert error_box.is_displayed()
        assert "salah" in error_box.text.lower()

    def test_tc_1_3_login_success(self):
        # Skenario: Login berhasil (Happy Path)
        self.driver.get(f"{BASE_URL}/login")
        self.driver.set_window_size(1280, 800)
        self.driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("okto@gmail.com")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("password123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Menunggu pengalihan ke halaman berikutnya
        time.sleep(2)
        assert "select-device" in self.driver.current_url or "dashboard" in self.driver.current_url or "onboarding" in self.driver.current_url

    # ==========================================
    # 2. PENGUJIAN REGISTRASI (TC 2.1 - 2.3)
    # ==========================================

    def test_tc_2_1_register_empty(self):
        # Skenario: Mengosongkan semua kolom registrasi
        self.driver.get(f"{BASE_URL}/register")
        self.driver.set_window_size(1280, 800)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        assert "register" in self.driver.current_url

    def test_tc_2_2_register_short_password(self):
        # Skenario: Mendaftarkan password kurang dari 6 karakter
        self.driver.get(f"{BASE_URL}/register")
        self.driver.set_window_size(1280, 800)
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Nama Lengkap']").send_keys("Okto")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("okto@gmail.com")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        time.sleep(1)
        error_box = self.driver.find_element(By.CSS_SELECTOR, "div.border-red-500")
        assert "minimal" in error_box.text.lower() or "panjang" in error_box.text.lower() or "gagal" in error_box.text.lower()

    def test_tc_2_3_register_success(self):
        # Skenario: Registrasi sukses (Happy Path)
        self.driver.get(f"{BASE_URL}/register")
        self.driver.set_window_size(1280, 800)
        unique_email = f"user_{int(time.time())}@gmail.com"
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Nama Lengkap']").send_keys("User Baru")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(unique_email)
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("password123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        time.sleep(2)
        # Registrasi sukses langsung mengalihkan ke halaman onboarding kuesioner wajib
        assert "onboarding" in self.driver.current_url

    # ==========================================
    # 3. EDIT PROFIL & PASSWORD (TC 4.1 - 4.4)
    # ==========================================

    def _login_helper(self):
        self.driver.get(f"{BASE_URL}/login")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("okto@gmail.com")
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("password123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1.5)

    def test_tc_4_1_profile_empty_name(self):
        self._login_helper()
        self.driver.get(f"{BASE_URL}/profile")
        # Kosongkan nama lengkap
        name_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Nama Lengkap']")
        name_input.clear()
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Verifikasi kemunculan box alert error
        error_box = self.driver.find_element(By.CSS_SELECTOR, "div.text-red-400")
        assert "kosong" in error_box.text.lower()

    def test_tc_4_3_profile_update_success(self):
        self._login_helper()
        self.driver.get(f"{BASE_URL}/profile")
        # Tulis nama baru
        name_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Nama Lengkap']")
        name_input.clear()
        name_input.send_keys("Okto Bagas")
        # Simpan
        self.driver.find_element(By.CSS_SELECTOR, "form").submit()
        
        time.sleep(1)
        success_box = self.driver.find_element(By.CSS_SELECTOR, "div.text-emerald-400")
        assert "berhasil" in success_box.text.lower()

    # ==========================================
    # 4. HISTORI TANGGAL & DATEPICKER (TC 8.1 - 8.3)
    # ==========================================

    def test_tc_8_2_date_navigation(self):
        self._login_helper()
        # Masuk langsung ke dashboard
        self.driver.get(f"{BASE_URL}/dashboard")
        time.sleep(2)
        
        # Cari tombol navigasi Kemarin
        prev_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Kemarin')]")
        assert prev_btn.is_displayed()
        prev_btn.click()
        time.sleep(1)
        
        # Cari tombol navigasi Besok
        next_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Besok')]")
        assert next_btn.is_displayed()
        next_btn.click()
        time.sleep(1)

    def test_tc_8_3_datepicker_filter(self):
        self._login_helper()
        self.driver.get(f"{BASE_URL}/dashboard")
        time.sleep(2)
        
        # Cari input DatePicker
        datepicker = self.driver.find_element(By.CSS_SELECTOR, "input[type='date']")
        assert datepicker.is_displayed()
        # Ubah tanggal ke 15 Juni 2026
        datepicker.send_keys("15062026")
        time.sleep(1)

    # ==========================================
    # 5. PENGATURAN AI & SENSITIVITAS (TC 10.1 - 10.3)
    # ==========================================

    def test_tc_10_2_ai_settings_high_risk(self):
        self._login_helper()
        self.driver.get(f"{BASE_URL}/settings")
        time.sleep(1.5)
        
        # Cari pilihan kelompok rentan (Bayi / Balita)
        baby_btn = self.driver.find_element(By.XPATH, "//button[span[contains(text(), 'Bayi / Balita')]]")
        baby_btn.click()
        
        # Simpan Perubahan
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        time.sleep(1.5)
        # Verifikasi tulisan Modus Sensitivitas Tinggi menyala merah di panel kanan
        risk_mode = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Modus Sensitivitas Tinggi')]")
        assert risk_mode.is_displayed()

    # ==========================================
    # 6. ADMIN PORTAL & DASHBOARD (TC 11.3 - 12.1)
    # ==========================================

    def test_tc_11_3_admin_login_success(self):
        # Skenario: Login admin dengan kredensial valid
        self.driver.get(f"{BASE_URL}/admin")
        self.driver.set_window_size(1280, 800)
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='admin_xxx']").send_keys("admin")
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='••••••••']").send_keys("admin123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        time.sleep(2)
        assert "admin/dashboard" in self.driver.current_url

    def test_tc_12_1_admin_add_device(self):
        # Skenario: Admin mendaftarkan alat baru ke MySQL/Firebase
        self.driver.get(f"{BASE_URL}/admin")
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='admin_xxx']").send_keys("admin")
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='••••••••']").send_keys("admin123")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1.5)
        
        # Klik tombol tambah device
        add_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Tambah Device') or contains(., 'Device')]")
        add_btn.click()
        
        # Masukkan Device ID baru
        time.sleep(0.5)
        id_input = self.driver.find_element(By.CSS_SELECTOR, "input[placeholder='Contoh: CS-DAPUR-01']")
        new_id = f"CS-TEST-{int(time.time())}"
        id_input.send_keys(new_id)
        
        # Klik Simpan
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Simpan')]").click()
        time.sleep(1.5)
        
        # Verifikasi modal QR Code terbuka dan menunjukkan pendaftaran sukses
        qr_title = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Pendaftaran Alat Sukses!')]")
        assert qr_title.is_displayed()
