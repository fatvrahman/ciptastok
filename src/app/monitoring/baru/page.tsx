"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { withAuth } from "@/lib/auth";
import {
  Loader2,
  ArrowLeft,
  Plus,
  X,
  Warehouse,
  Users,
  FileText,
  Save,
} from "lucide-react";
import Link from "next/link";
import { Alert, useToast, ToastContainer } from '@/components/ui/alert';

interface User {
  user_id: number;
  nama_lengkap: string;
  username: string;
  email: string;
  divisi_id: number | null;
  nama_divisi: string | null;
}

function CreateOpnamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nama_batch: "",
    tipe_opname: "WH01",
    user_ids: [] as number[],
  });

  const [error, setError] = useState("");

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        console.log('Fetching users for assignment...');
        const response = await api.get("/users");
        console.log('Users response:', response.data);
        const usersWithDivisi = response.data.filter((u: User) => u.divisi_id !== null);
        console.log('Users with divisi:', usersWithDivisi);
        setUsers(usersWithDivisi);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        console.error("Error response:", err.response);
        setError(err.response?.data?.msg || err.message || "Gagal memuat daftar user");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nama_batch.trim()) {
      setError("Nama batch wajib diisi");
      return;
    }

    if (formData.user_ids.length === 0) {
      setError("Minimal pilih 1 user untuk ditugaskan");
      return;
    }

    try {
      setLoading(true);
      await api.post("/opname/batch", formData);
      addToast({ variant: 'success', message: "Batch opname berhasil dibuat!" });
      
      // Delay redirect agar toast terlihat
      setTimeout(() => {
        router.push("/monitoring");
      }, 2000); // 2 detik delay
    } catch (err: any) {
      console.error("Error creating batch:", err);
      setError(err.response?.data?.msg || "Gagal membuat batch opname");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId)
        ? prev.user_ids.filter((id) => id !== userId)
        : [...prev.user_ids, userId],
    }));
  };

  const selectedUsers = users.filter((u) =>
    formData.user_ids.includes(u.user_id)
  );

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div>
        <Link
          href="/monitoring"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Monitoring
        </Link>

        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Buat Assignment Opname Baru
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Buat batch opname dan tugaskan ke user
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        {error && (
          <div className="mb-6 rounded-lg border border-red-400 bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Batch */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              <FileText className="mb-1 inline h-4 w-4" /> Nama Batch
            </label>
            <input
              type="text"
              value={formData.nama_batch}
              onChange={(e) =>
                setFormData({ ...formData, nama_batch: e.target.value })
              }
              placeholder="Contoh: Opname Januari 2024"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tipe Opname */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              <Warehouse className="mb-1 inline h-4 w-4" /> Tipe Gudang
            </label>
            <select
              value={formData.tipe_opname}
              onChange={(e) =>
                setFormData({ ...formData, tipe_opname: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="WH01">WH01 - Stock Rak</option>
              <option value="WH02">WH02 - Stock Koli</option>
              <option value="WH03">WH03 - Stock Karton</option>
            </select>
          </div>

          {/* User Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              <Users className="mb-1 inline h-4 w-4" /> Pilih User (
              {formData.user_ids.length} terpilih)
            </label>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary dark:bg-primary/20"
                      >
                        <span>{user.nama_lengkap}</span>
                        <button
                          type="button"
                          onClick={() => toggleUser(user.user_id)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* User List */}
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-3 dark:border-gray-600">
                  {users.length === 0 ? (
                    <p className="text-center text-sm text-gray-500">
                      Tidak ada user dengan divisi
                    </p>
                  ) : (
                    users.map((user) => (
                      <label
                        key={user.user_id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.user_ids.includes(user.user_id)}
                          onChange={() => toggleUser(user.user_id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.username} • {user.nama_divisi || "No Division"}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push("/monitoring")}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Buat Batch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAuth(CreateOpnamePage);
