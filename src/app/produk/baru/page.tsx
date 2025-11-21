"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { withAuth } from "@/lib/auth";
import {
  Loader2,
  ArrowLeft,
  Save,
  Package,
  Barcode,
  Building2,
  Box,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Alert, useToast, ToastContainer } from '@/components/ui/alert';

interface Divisi {
  divisi_id: number;
  nama_divisi: string;
  kode_divisi: string;
}

interface Rak {
  rak_id: number;
  nomor_rak: string;
}

function TambahProdukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [rakList, setRakList] = useState<Rak[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    pcode: "",
    nama_barang: "",
    barcode: "",
    divisi_id: "",
    warehouse: "wh01", // Default warehouse
    sistem_karton: "0",
    sistem_tengah: "0",
    sistem_pieces: "0",
    expired_date: "",
    rak_id: "",
    sistem_total_pcs_bs: "0",
    sistem_total_pcs_promo: "0",
  });

  const [error, setError] = useState("");

  // Fetch divisi and rak
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
      console.log('Fetching divisi and rak...');
      const [divisiRes, rakRes] = await Promise.all([
          api.get("/master/divisi"),
          api.get("/master/rak"),
        ]);
        console.log('Divisi response:', divisiRes.data);
        console.log('Rak response:', rakRes.data);
        setDivisiList(divisiRes.data);
        setRakList(rakRes.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        console.error("Error response:", err.response);
        setError(err.response?.data?.msg || err.message || "Gagal memuat data divisi dan rak");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.pcode.trim() || !formData.nama_barang.trim() || !formData.divisi_id || !formData.warehouse) {
      setError("PCode, Nama Barang, Divisi, dan Warehouse wajib diisi");
      return;
    }

    try {
      setLoading(true);
      await api.post("/produk", {
        ...formData,
        divisi_id: parseInt(formData.divisi_id),
        rak_id: formData.rak_id ? parseInt(formData.rak_id) : null,
        sistem_karton: parseInt(formData.sistem_karton) || 0,
        sistem_tengah: parseInt(formData.sistem_tengah) || 0,
        sistem_pieces: parseInt(formData.sistem_pieces) || 0,
        sistem_total_pcs_bs: parseInt(formData.sistem_total_pcs_bs) || 0,
        sistem_total_pcs_promo: parseInt(formData.sistem_total_pcs_promo) || 0,
        expired_date: formData.expired_date || null,
        warehouse: formData.warehouse,
      });
      addToast({ variant: 'success', message: "Produk berhasil ditambahkan!" });
      
      // Delay redirect agar toast terlihat
      setTimeout(() => {
        router.push("/produk");
      }, 2000); // 2 detik delay
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError(err.response?.data?.msg || "Gagal menambahkan produk");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div>
        <Link
          href="/produk"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Produk
        </Link>

        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Tambah Produk Baru
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tambahkan master data produk ke inventory
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* PCode */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                <Package className="mb-1 inline h-4 w-4" /> PCode *
              </label>
              <input
                type="text"
                value={formData.pcode}
                onChange={(e) =>
                  setFormData({ ...formData, pcode: e.target.value })
                }
                placeholder="Contoh: P001"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Nama Barang */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                <Box className="mb-1 inline h-4 w-4" /> Nama Barang *
              </label>
              <input
                type="text"
                value={formData.nama_barang}
                onChange={(e) =>
                  setFormData({ ...formData, nama_barang: e.target.value })
                }
                placeholder="Nama produk"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                <Barcode className="mb-1 inline h-4 w-4" /> Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                placeholder="Barcode produk (opsional)"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Divisi */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                <Building2 className="mb-1 inline h-4 w-4" /> Divisi *
              </label>
              <select
                value={formData.divisi_id}
                onChange={(e) =>
                  setFormData({ ...formData, divisi_id: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Pilih Divisi</option>
                {divisiList.map((d) => (
                  <option key={d.divisi_id} value={d.divisi_id}>
                    {d.nama_divisi} ({d.kode_divisi})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Tujuan */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                <Package className="mb-1 inline h-4 w-4" /> Warehouse Tujuan *
              </label>
              <select
                value={formData.warehouse}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="wh01">WH01 - Warehouse Utama (Rak)</option>
                <option value="wh02">WH02 - BS</option>
                <option value="wh03">WH03 - Promo</option>
              </select>
            </div>
          </div>

          {/* WH01 Stock - Hanya tampil jika warehouse = wh01 */}
          {formData.warehouse === "wh01" && (
          <div className="rounded-lg border border-gray-300 p-4 dark:border-gray-600">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Stock WH01 (Rak)
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                  Karton
                </label>
                <input
                  type="number"
                  value={formData.sistem_karton}
                  onChange={(e) =>
                    setFormData({ ...formData, sistem_karton: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                  Tengah
                </label>
                <input
                  type="number"
                  value={formData.sistem_tengah}
                  onChange={(e) =>
                    setFormData({ ...formData, sistem_tengah: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                  Pieces
                </label>
                <input
                  type="number"
                  value={formData.sistem_pieces}
                  onChange={(e) =>
                    setFormData({ ...formData, sistem_pieces: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="inline h-3 w-3" /> Rak
                </label>
                <select
                  value={formData.rak_id}
                  onChange={(e) =>
                    setFormData({ ...formData, rak_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Pilih Rak</option>
                  {rakList.map((r) => (
                    <option key={r.rak_id} value={r.rak_id}>
                      {r.nomor_rak}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                <Calendar className="inline h-3 w-3" /> Expired Date
              </label>
              <input
                type="date"
                value={formData.expired_date}
                onChange={(e) =>
                  setFormData({ ...formData, expired_date: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:w-1/2"
              />
            </div>
          </div>
          )}

          {/* WH02 Stock - Hanya tampil jika warehouse = wh02 */}
          {formData.warehouse === "wh02" && (
          <div className="rounded-lg border border-gray-300 p-4 dark:border-gray-600">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Stock WH02 (BS)
            </h3>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
              Total Pieces
            </label>
            <input
              type="number"
              value={formData.sistem_total_pcs_bs}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sistem_total_pcs_bs: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          )}

          {/* WH03 Stock - Hanya tampil jika warehouse = wh03 */}
          {formData.warehouse === "wh03" && (
          <div className="rounded-lg border border-gray-300 p-4 dark:border-gray-600">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Stock WH03 (Promo)
            </h3>
            <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
              Total Pieces
            </label>
            <input
              type="number"
              value={formData.sistem_total_pcs_promo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sistem_total_pcs_promo: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push("/produk")}
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
                  Simpan Produk
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAuth(TambahProdukPage);
