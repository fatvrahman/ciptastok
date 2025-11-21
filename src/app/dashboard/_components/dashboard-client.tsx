"use client";

import { useState, useEffect } from "react";
import { withAuth } from "@/lib/auth";
// ApexTheme not exported in some versions — use any to avoid build-time TS errors on theme
import api from "@/lib/api";
import dynamic from "next/dynamic";
import WelcomeAlert from "@/components/WelcomeAlert";
import { 
  Package, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Loader2,
  Activity,
  Box,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Warehouse
} from "lucide-react";

// Dynamically import Chart to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function DashboardClientComponent() {
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);
  const [stats, setStats] = useState<any>({
    totalProduk: 0,
    totalStock: 0,
    totalUser: 0,
    opnameStats: {
      inProgress: 0,
      total: 0,
      last30Days: 0,
    },
    stockHealth: [],
    divisionStats: [],
  });
  const [additionalMetrics, setAdditionalMetrics] = useState<any>({
    completedBatchThisMonth: 0,
    avgCompletionRate: 0,
    pendingApproval: 0,
    topUser: null,
    warehouseBreakdown: [],
    totalRupiah: 0,
  });
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [activeOpname, setActiveOpname] = useState<any[]>([]);
  const [opnameUsers, setOpnameUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({
    products: {
      total: [],
      inStock: [],
    },
    opname: {
      batches: [],
      completion: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we should show welcome alert
    const shouldShowAlert = localStorage.getItem("showWelcomeAlert");
    if (shouldShowAlert === "true") {
      setShowWelcomeAlert(true);
      localStorage.removeItem("showWelcomeAlert"); // Remove flag after reading
    }

    fetchDashboardData();
    fetchAdditionalMetrics();
    fetchChartData();
  }, []);

  const handleCloseWelcomeAlert = () => {
    setShowWelcomeAlert(false);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/dashboard/stats");

      if (!response.data) {
        throw new Error("No data received from server");
      }

      setStats({
        totalProduk: response.data.totalProduk || 0,
        totalStock: response.data.totalStock || 0,
        totalUser: response.data.totalUser || 0,
        opnameStats: response.data.opnameStats || {
          inProgress: 0,
          total: 0,
          last30Days: 0,
        },
        stockHealth: response.data.stockHealth || [],
        divisionStats: response.data.divisionStats || [],
      });

      setActiveOpname(response.data.activeOpname || []);

      const activities = (response.data.recentActivity || []).map((activity: any) => ({
        id: activity.log_id,
        type: activity.aktivitas.toLowerCase().includes("produk")
          ? "product"
          : activity.aktivitas.toLowerCase().includes("user")
            ? "user"
            : "opname",
        description: activity.aktivitas,
        user: {
          name: activity.nama_lengkap,
          role: activity.nama_role,
          division: activity.nama_divisi,
        },
        timestamp: new Date(activity.waktu).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setActivityFeed(activities);
      setOpnameUsers(response.data.userPerformance || []);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      let errorMessage = "Gagal memuat data dashboard";
      if (err.response) {
        errorMessage = err.response.data?.msg || `Error ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Tidak dapat terhubung ke server";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalMetrics = async () => {
    try {
      const response = await api.get("/dashboard/metrics");
      setAdditionalMetrics({
        completedBatchThisMonth: response.data.completedBatchThisMonth || 0,
        avgCompletionRate: response.data.avgCompletionRate || 0,
        pendingApproval: response.data.pendingApproval || 0,
        topUser: response.data.topUser || null,
        warehouseBreakdown: response.data.warehouseBreakdown || [],
        totalRupiah: response.data.totalRupiah || 0,
      });
    } catch (err: any) {
      console.error("Failed to fetch additional metrics:", err?.response?.data || err?.message || err);
      // Set default values on error to prevent UI breaking
      setAdditionalMetrics({
        completedBatchThisMonth: 0,
        avgCompletionRate: 0,
        pendingApproval: 0,
        topUser: null,
        warehouseBreakdown: [],
        totalRupiah: 0,
      });
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await api.get("/dashboard/monthly");
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const productData = monthNames.map((month, index) => {
        const monthStats = response.data.productStats.find(
          (s: any) => s.month === index + 1
        ) || { total_products: 0, in_stock_products: 0 };
        return {
          date: month,
          total: monthStats.total_products,
          inStock: monthStats.in_stock_products,
        };
      });

      const opnameData = monthNames.map((month, index) => {
        const monthStats = response.data.opnameStats.find(
          (s: any) => s.month === index + 1
        ) || {
          total_batches: 0,
          completed_batches: 0,
          total_assignments: 0,
          completed_assignments: 0,
        };
        return {
          date: month,
          batches: monthStats.total_batches,
          completion:
            (monthStats.completed_assignments / monthStats.total_assignments) * 100 || 0,
        };
      });

      setChartData({
        products: {
          total: productData.map((d: any) => d.total),
          inStock: productData.map((d: any) => d.inStock),
        },
        opname: {
          batches: opnameData.map((d: any) => d.batches),
          completion: opnameData.map((d: any) => d.completion),
        },
      });
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border border-red/20 bg-red/10 p-4 text-red">
          {error}
        </div>
      </div>
    );
  }

  const totalHealthy = stats.stockHealth.reduce(
    (acc: number, wh: any) => acc + wh.in_stock,
    0
  );
  const totalProducts = stats.stockHealth.reduce(
    (acc: number, wh: any) => acc + wh.total_products,
    0
  );

  const formatNumber = (num: any) => {
    if (!num) return "0";
    // Round to integer and remove leading zeros
    const rounded = Math.round(Number(num));
    return rounded.toString().replace(/^0+/, "") || "0";
  };

  const formatPercentage = (num: any) => {
    if (!num) return "0%";
    return `${Math.round(Number(num))}%`;
  };

  // Chart theme configuration - Green Theme
  const chartTheme = {
    mode: 'light' as 'light' | 'dark',
    palette: 'palette1',
  } as any;
  const primaryGreen = '#1A4D2E';
  const secondaryGreen = '#4E9F3D';
  const tertiaryGreen = '#8FD14F';
  const textColor = '#4B5563';
  const gridColor = '#E5E7EB';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6 mt-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Overview statistik dan monitoring sistem inventory
        </p>
      </div>

      {/* Top Metric Cards - 4 Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Total Produk Aktif */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1A4D2E]/10">
              <Box className="h-5 w-5 text-[#1A4D2E]" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Total Produk Aktif
          </h3>
          <p className="text-2xl font-bold text-[#1A4D2E] mb-1">
            {formatNumber(stats.totalProduk || 0)}
          </p>
          <p className="text-xs text-gray-500">
            Produk terdaftar
          </p>
        </div>

        {/* Card 2 - Pengguna Aktif */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#4E9F3D]/10">
              <UserCheck className="h-5 w-5 text-[#4E9F3D]" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Pengguna Aktif
          </h3>
          <p className="text-2xl font-bold text-[#4E9F3D] mb-1">
            {formatNumber(stats.totalUser || 0)}
          </p>
          <p className="text-xs text-gray-500">
            Semua divisi
          </p>
        </div>

        {/* Card 3 - Opname Berjalan */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#8FD14F]/10">
              <ClipboardList className="h-5 w-5 text-[#4E9F3D]" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Opname Berjalan
          </h3>
          <p className="text-2xl font-bold text-[#4E9F3D] mb-1">
            {formatNumber(stats.opnameStats.inProgress || 0)}
          </p>
          <p className="text-xs text-gray-500">
            {formatNumber(stats.opnameStats.last30Days || 0)} dalam 30 hari
          </p>
        </div>

        {/* Card 4 - Stok Tersedia */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1A4D2E]/10">
              <Package className="h-5 w-5 text-[#1A4D2E]" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Stok Tersedia
          </h3>
          <p className="text-2xl font-bold text-[#1A4D2E] mb-1">
            {Math.round(stats.totalStock || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">
            dari {formatNumber(stats.totalProduk || 0)} produk
          </p>
        </div>

        {/* Card 5 - Batch Selesai Bulan Ini */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Batch Selesai Bulan Ini
          </h3>
          <p className="text-2xl font-bold text-green-600 mb-1">
            {formatNumber(additionalMetrics.completedBatchThisMonth)}
          </p>
          <p className="text-xs text-gray-500">
            Opname selesai
          </p>
        </div>

        {/* Card 6 - Pending Approval */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Pending Approval
          </h3>
          <p className="text-2xl font-bold text-amber-600 mb-1">
            {formatNumber(additionalMetrics.pendingApproval)}
          </p>
          <p className="text-xs text-gray-500">
            Menunggu persetujuan
          </p>
        </div>

        {/* Card 7 - Completion Rate */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Rata-rata Completion
          </h3>
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {formatPercentage(additionalMetrics.avgCompletionRate)}
          </p>
          <p className="text-xs text-gray-500">
            Tingkat penyelesaian
          </p>
        </div>

        {/* Card 8 - Total Rupiah */}
        <div className="rounded-lg border-2 border-gray-300 bg-transparent p-5 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100">
              <span className="text-sm font-bold text-green-600">Rp</span>
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-600 mb-1">
            Total Rupiah
          </h3>
          <p className="text-2xl font-bold text-green-600 mb-1">
            Rp{Math.round(additionalMetrics.totalRupiah).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-500">
            Nilai total produk
          </p>
        </div>
      </div>

      {/* Top User Card - Full Width */}
      {additionalMetrics.topUser && (
        <div className="rounded-lg border-2 border-gray-300 bg-gradient-to-r from-[#1A4D2E]/5 to-[#4E9F3D]/5 p-6 hover:border-[#1A4D2E] transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A4D2E] text-white">
                <Award className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Top Performer (30 Hari Terakhir)
                </h3>
                <p className="text-xl font-bold text-[#1A4D2E]">
                  {additionalMetrics.topUser.nama_lengkap}
                </p>
                <p className="text-sm text-gray-600">
                  {additionalMetrics.topUser.nama_role}
                </p>
                <div className="mt-2 inline-block">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A4D2E]/10 px-3 py-1.5 text-sm font-medium text-[#1A4D2E]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {additionalMetrics.topUser.kode_divisi && additionalMetrics.topUser.nama_divisi
                      ? `${additionalMetrics.topUser.kode_divisi} - ${additionalMetrics.topUser.nama_divisi}`
                      : additionalMetrics.topUser.nama_divisi || '-'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#4E9F3D]">
                {formatNumber(additionalMetrics.topUser.task_count)}
              </p>
              <p className="text-sm text-gray-500">Tugas diselesaikan</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid - Charts and Warehouse Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Section - Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress Opname Chart */}
          <div className="rounded-lg border-2 border-gray-300 bg-white p-6 hover:border-[#1A4D2E] transition-colors shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Progress Stock Opname
            </h2>
            <Chart
              options={{
                chart: {
                  type: "bar",
                  height: 300,
                  toolbar: { show: false },
                  background: 'transparent',
                },
                theme: chartTheme,
                dataLabels: { enabled: false },
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4,
                  },
                },
                colors: [primaryGreen, secondaryGreen],
                xaxis: {
                  categories: [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                  ],
                  labels: { style: { colors: textColor } },
                  axisBorder: { color: gridColor },
                  axisTicks: { color: gridColor },
                },
                yaxis: {
                  labels: { 
                    style: { colors: textColor },
                    formatter: function (val) {
                      return Math.round(val).toString();
                    }
                  },
                },
                grid: {
                  borderColor: gridColor,
                  strokeDashArray: 5,
                },
                legend: {
                  position: "top",
                  horizontalAlign: "right",
                  labels: { colors: textColor },
                },
                tooltip: {
                  y: {
                    formatter: function (val) {
                      return Math.round(val).toString();
                    }
                  }
                },
              }}
              series={[
                {
                  name: "Batch Opname",
                  data: chartData.opname.batches,
                },
                {
                  name: "Tingkat Penyelesaian (%)",
                  data: chartData.opname.completion,
                },
              ]}
              type="bar"
              height={300}
            />
          </div>

          {/* Tren Produk Statistics */}
          <div className="rounded-lg border-2 border-gray-300 bg-white p-6 hover:border-[#1A4D2E] transition-colors shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Statistik Tren Produk
            </h2>
            <Chart
              options={{
                chart: {
                  type: "area",
                  height: 250,
                  toolbar: { show: false },
                  zoom: { enabled: false },
                  background: 'transparent',
                },
                theme: chartTheme,
                dataLabels: { enabled: false },
                stroke: {
                  curve: "smooth",
                  width: 2,
                },
                fill: {
                  type: 'gradient',
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1,
                  }
                },
                colors: [primaryGreen, tertiaryGreen],
                xaxis: {
                  categories: [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                  ],
                  labels: { style: { colors: textColor } },
                  axisBorder: { color: gridColor },
                  axisTicks: { color: gridColor },
                },
                yaxis: {
                  labels: { 
                    style: { colors: textColor },
                    formatter: function (val) {
                      return Math.round(val).toString();
                    }
                  },
                },
                grid: {
                  borderColor: gridColor,
                  strokeDashArray: 5,
                },
                legend: {
                  position: "top",
                  horizontalAlign: "right",
                  labels: { colors: textColor },
                },
                tooltip: {
                  y: {
                    formatter: function (val) {
                      return Math.round(val).toString();
                    }
                  }
                },
              }}
              series={[
                {
                  name: "Total Produk",
                  data: chartData.products.total,
                },
                {
                  name: "Stok Tersedia",
                  data: chartData.products.inStock,
                },
              ]}
              type="area"
              height={250}
            />
          </div>
        </div>

        {/* Right Section - Warehouse Breakdown (1/3 width) */}
        <div className="space-y-4">
          {/* Warehouse Donut Chart */}
          <div className="rounded-lg border-2 border-gray-300 bg-white p-6 hover:border-[#1A4D2E] transition-colors shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Distribusi Warehouse
            </h2>
            <Chart
              options={{
                chart: {
                  type: "donut",
                  height: 300,
                },
                labels: additionalMetrics.warehouseBreakdown.map((wh: any) => wh.warehouse_code),
                colors: [primaryGreen, secondaryGreen, tertiaryGreen],
                legend: {
                  position: "bottom",
                  labels: { colors: textColor },
                },
                dataLabels: {
                  enabled: true,
                  formatter: function(val: number) {
                    return Math.round(val) + "%";
                  }
                },
                plotOptions: {
                  pie: {
                    donut: {
                      size: '70%',
                      labels: {
                        show: true,
                        total: {
                          show: true,
                          label: 'Total',
                          fontSize: '14px',
                          color: textColor,
                          formatter: function (w: any) {
                            return formatNumber(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0));
                          }
                        }
                      }
                    }
                  }
                },
                tooltip: {
                  y: {
                    formatter: function (val) {
                      return formatNumber(val) + " produk";
                    }
                  }
                },
              }}
              series={additionalMetrics.warehouseBreakdown.map((wh: any) => wh.products)}
              type="donut"
              height={300}
            />
          </div>

          {/* Warehouse Details List */}
          <div className="rounded-lg border-2 border-gray-300 bg-white p-6 hover:border-[#1A4D2E] transition-colors shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Detail Warehouse
            </h2>
            <div className="space-y-3">
              {additionalMetrics.warehouseBreakdown.map((wh: any, index: number) => (
                <div key={wh.warehouse_code} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-[#1A4D2E]/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ 
                        backgroundColor: index === 0 ? primaryGreen : index === 1 ? secondaryGreen : tertiaryGreen 
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {wh.warehouse_code}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatNumber(wh.in_stock)} stok tersedia
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#1A4D2E]">
                      {formatNumber(wh.products)}
                    </p>
                    <p className="text-xs text-gray-500">produk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <div className="rounded-lg border-2 border-gray-300 bg-white p-6 hover:border-[#1A4D2E] transition-colors shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Aktivitas Terbaru
          </h2>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A4D2E]/10">
            <Activity className="h-5 w-5 text-[#1A4D2E]" />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="flow-root">
          <ul className="-mb-8">
            {activityFeed.slice(0, 5).map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index < activityFeed.slice(0, 5).length - 1 && (
                    <span className="absolute left-4 top-5 -ml-px h-full w-0.5 bg-gray-200" />
                  )}
                  <div className="relative flex space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A4D2E]/10 ring-4 ring-white">
                      {activity.type === "product" ? (
                        <Package className="h-4 w-4 text-[#1A4D2E]" />
                      ) : activity.type === "user" ? (
                        <Users className="h-4 w-4 text-[#1A4D2E]" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-[#1A4D2E]" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-700">
                          {activity.description}
                          <span className="ml-1 font-semibold text-gray-900">
                            by {activity.user.name}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {activity.user.role}
                          {activity.user.division && ` • ${activity.user.division}`}
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-gray-500">
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Welcome Alert Modal */}
      {showWelcomeAlert && <WelcomeAlert onClose={handleCloseWelcomeAlert} />}
    </div>
  );
}

export const DashboardClient = withAuth(DashboardClientComponent);
