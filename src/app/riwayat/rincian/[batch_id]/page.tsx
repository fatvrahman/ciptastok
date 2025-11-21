"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, AlertTriangle, ArrowLeft, Eye, Calendar, 
  User, Warehouse, CheckCircle, XCircle, Package
} from 'lucide-react';

function RincianRiwayatPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batch_id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchInfo, setBatchInfo] = useState<any>({});
  const [assignments, setAssignments] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/opname/batch/${batchId}`);
      setBatchInfo(res.data.batchInfo || {});
      setAssignments(res.data.assignments || []);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Gagal memuat rincian riwayat opname.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) fetchData();
  }, [batchId]);

  const Badge = ({ variant, children }: any) => {
    const colors: any = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[variant] || colors.info}`}>{children}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="rounded-lg border border-red-400 bg-red-100 p-4 text-red-700 dark:bg-red-900/20"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/riwayat" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Riwayat
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-black dark:text-white">Rincian Riwayat Opname</h1>
        <p className="mt-2 text-sm text-bodydark1">Detail batch: {batchInfo.nama_batch}</p>
      </div>

      {/* Batch Info Card */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-bodydark" />
            <div>
              <p className="text-xs text-bodydark">Nama Batch</p>
              <p className="text-sm font-semibold text-black dark:text-white">{batchInfo.nama_batch || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-bodydark" />
            <div>
              <p className="text-xs text-bodydark">Pembuat</p>
              <p className="text-sm font-semibold text-black dark:text-white">{batchInfo.pembuat || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Warehouse className="h-5 w-5 text-bodydark" />
            <div>
              <p className="text-xs text-bodydark">Tipe Gudang</p>
              <div className="mt-1">
                {batchInfo.tipe_opname === 'WH01' && <Badge variant="purple">WH01</Badge>}
                {batchInfo.tipe_opname === 'WH02' && <Badge variant="danger">WH02</Badge>}
                {batchInfo.tipe_opname === 'WH03' && <Badge variant="info">WH03</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-bodydark" />
            <div>
              <p className="text-xs text-bodydark">Status</p>
              <div className="mt-1">
                {batchInfo.status_overall === 'Completed' && <Badge variant="success"><CheckCircle className="inline h-3 w-3 mr-1" />Selesai</Badge>}
                {batchInfo.status_overall === 'Cancelled' && <Badge variant="danger"><XCircle className="inline h-3 w-3 mr-1" />Dibatalkan</Badge>}
                {batchInfo.status_overall === 'In Progress' && <Badge variant="warning">In Progress</Badge>}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-stroke pt-4 dark:border-strokedark md:grid-cols-2">
          <div>
            <p className="text-xs text-bodydark">Tanggal Dibuat</p>
            <p className="text-sm font-medium text-black dark:text-white">
              {batchInfo.created_at ? new Date(batchInfo.created_at).toLocaleString('id-ID') : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-bodydark">Tanggal Selesai</p>
            <p className="text-sm font-medium text-black dark:text-white">
              {batchInfo.completed_at ? new Date(batchInfo.completed_at).toLocaleString('id-ID') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
          <h2 className="text-lg font-semibold text-black dark:text-white">Daftar Assignment</h2>
          <p className="mt-1 text-sm text-bodydark">Total: {assignments.length} assignment</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">No</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">Petugas</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">Divisi</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">Ditugaskan</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">Diserahkan</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-black dark:text-white">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-bodydark">Tidak ada assignment</td></tr>
              ) : (
                assignments.map((a, i) => (
                  <tr key={a.assignment_id} className="border-b border-stroke hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
                    <td className="px-3 py-2.5 text-sm text-black dark:text-white">{i + 1}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-black dark:text-white">{a.nama_user || '-'}</td>
                    <td className="px-3 py-2.5 text-sm text-bodydark">{a.nama_divisi || '-'}</td>
                    <td className="px-3 py-2.5">
                      {a.status_assignment === 'Approved' && <Badge variant="success">Approved</Badge>}
                      {a.status_assignment === 'Rejected' && <Badge variant="danger">Rejected</Badge>}
                      {a.status_assignment === 'Submitted' && <Badge variant="warning">Submitted</Badge>}
                      {a.status_assignment === 'In Progress' && <Badge variant="info">In Progress</Badge>}
                      {a.status_assignment === 'Pending' && <Badge variant="default">Pending</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-bodydark">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-bodydark">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => router.push(`/riwayat/detail/${a.assignment_id}`)}
                        className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAuth(RincianRiwayatPage);
