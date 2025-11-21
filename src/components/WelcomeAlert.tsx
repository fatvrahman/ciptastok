"use client";

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Activity, Package } from 'lucide-react';
import api from '@/lib/api';

interface WelcomeAlertProps {
  onClose: () => void;
}

export default function WelcomeAlert({ onClose }: WelcomeAlertProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWelcomeData();
  }, []);

  const fetchWelcomeData = async () => {
    try {
      const res = await api.get('/alerts/login-welcome');
      if (res.data.enabled) {
        setData(res.data);
      } else {
        onClose(); // Auto close if alert disabled
      }
    } catch (error) {
      console.error('Error fetching welcome data:', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-300 rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <div className="absolute right-12 top-12 h-20 w-20 translate-x-4 -translate-y-4 rounded-full bg-white/10" />
          
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative">
            <h2 className="text-2xl font-bold">
              Selamat Datang! 👋
            </h2>
            <p className="mt-1 text-lg font-semibold text-white/90">
              {data.user.nama_lengkap}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {data.user.role} • {data.user.divisi}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-bodydark">
              Ringkasan Hari Ini
            </h3>
            
            <div className="grid gap-3">
              {/* Pending Tasks */}
              {data.data.pendingTasks > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                      {data.data.pendingTasks} Tugas Opname Menunggu
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      Segera cek dan selesaikan tugas opname yang tertunda
                    </p>
                  </div>
                </div>
              )}

              {/* Total Rupiah */}
              {data.data.totalRupiah > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">Rp</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                      Total Nilai Produk: Rp{Math.round(data.data.totalRupiah).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Total nilai semua produk aktif di warehouse
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    {data.data.recentActivitiesCount} Aktivitas (7 Hari Terakhir)
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Riwayat aktivitas Anda dalam seminggu terakhir
                  </p>
                </div>
              </div>

              {/* All Clear */}
              {data.data.pendingTasks === 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                      Semua Lancar! ✓
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Tidak ada tugas mendesak atau alert sistem saat ini
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-meta-4">
            <p className="text-center text-xs text-bodydark">
              💡 Tip: Anda bisa menonaktifkan alert ini di{' '}
              <span className="font-semibold text-primary">Pengaturan → Manajemen Alert</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Mulai Bekerja
          </button>
        </div>
      </div>
    </div>
  );
}
