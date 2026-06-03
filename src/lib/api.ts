// Backend API Client for CarbonSense

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Device {
  id: string;
  userEmail?: string;
  status: string;
  ppm: string | number;
  lastActive: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export const api = {
  // Authentication API calls
  auth: {
    async register(data: Record<string, string>): Promise<AuthResponse> {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal mendaftar.');
      return body;
    },

    async login(data: Record<string, string>): Promise<AuthResponse> {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal login.');
      return body;
    },

    async adminLogin(data: Record<string, string>): Promise<AuthResponse> {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal login admin.');
      return body;
    }
  },

  // Devices API calls
  devices: {
    async list(email?: string): Promise<Device[]> {
      const url = email 
        ? `${API_BASE_URL}/api/devices?email=${encodeURIComponent(email)}`
        : `${API_BASE_URL}/api/devices`;
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal memuat perangkat.');
      return body;
    },

    async create(data: { id: string; status: string }): Promise<Device> {
      const res = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal membuat perangkat.');
      return body;
    },

    async bind(data: { deviceId: string; userEmail: string }): Promise<{ message: string; device: Device }> {
      const res = await fetch(`${API_BASE_URL}/api/devices/bind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal menautkan perangkat.');
      return body;
    },

    async delete(id: string): Promise<{ message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/devices/${id}`, {
        method: 'DELETE'
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal menghapus perangkat.');
      return body;
    },

    async updateTelemetry(data: { id: string; ppm?: string | number; status?: string }): Promise<Device> {
      const res = await fetch(`${API_BASE_URL}/api/devices/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal mengirim telemetri.');
      return body;
    }
  }
};
