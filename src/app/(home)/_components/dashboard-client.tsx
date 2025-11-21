"use client";

import { useState, useEffect } from "react";
import { withAuth } from "@/lib/auth";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { 
  Package, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Loader2,
  Activity,
  MoreHorizontal,
  Sparkles,
  TrendingDown,
  Box,
  UserCheck
} from "lucide-react";

// Dynamically import Chart to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function DashboardClientComponent() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>({
    totalProduk: 0,
    totalUser: 0,
    opnameStats: {
      inProgress: 0,
      total: 0,
      last30Days: 0,
    },
    stockHealth: [],
    divisionStats: [],
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
    fetchDashboardData();
    fetchChartData();
  }, []);

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
    return num.toString().replace(/^0+/, "") || "0";
  };

  const statsData = [
    {
      icon: Box,
      title: "Total Produk Aktif",
      value: formatNumber(stats.totalProduk || 0),
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      detail: `${formatNumber(totalProducts)} produk terdaftar`,
      change: "+12%",
      changeType: "positive" as const,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: UserCheck,
      title: "Pengguna Aktif",
      value: formatNumber(stats.totalUser || 0),
      gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
      detail: "Semua divisi aktif",
      change: "+5%",
      changeType: "positive" as const,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: ClipboardList,
      title: "Opname Berjalan",
      value: formatNumber(stats.opnameStats.inProgress || 0),
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      detail: `${formatNumber(stats.opnameStats.last30Days || 0)} dalam 30 hari`,
      change: "+8%",
      changeType: "positive" as const,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: Package,
      title: "Stok Tersedia",
      value: formatNumber(totalHealthy || 0),
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      detail: totalProducts
        ? `dari ${formatNumber(totalProducts)} produk`
        : "Tidak ada produk",
      change: "-2%",
      changeType: "negative" as const,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  // Chart theme configuration
  const isDark = theme === 'dark';
  const chartTheme = {
    mode: isDark ? ('dark' as 'dark' | 'light') : ('light' as 'dark' | 'light'),
    palette: isDark ? 'palette2' : 'palette1',
  } as any;
  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Dashboard CiptaStok
            </h1>
            <p className="mt-2 text-sm text-bodydark1 dark:text-bodydark">
              Overview statistik dan monitoring sistem inventory
            </p>
          </div>
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-stroke bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-strokedark dark:bg-boxdark"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />
            
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-1">
                  {stat.changeType === "positive" ? (
                    <TrendingUp className="h-4 w-4 text-meta-3" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-meta-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.changeType === "positive" ? "text-meta-3" : "text-meta-1"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-bodydark1 dark:text-bodydark">
                  {stat.title}
                </h3>
                <p className="mt-2 text-3xl font-bold text-black dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-bodydark1 dark:text-bodydark">
                  {stat.detail}
                </p>
              </div>
            </div>

            {/* Bottom gradient line */}
            <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Product Trends */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h2 className="mb-6 text-xl font-semibold text-black dark:text-white">
            Tren Produk
          </h2>
          <Chart
            options={{
              chart: {
                type: "area",
                height: 350,
                toolbar: { show: false },
                zoom: { enabled: false },
                background: 'transparent',
              },
              theme: chartTheme,
              dataLabels: { enabled: false },
              stroke: {
                curve: "smooth",
                width: 3,
              },
              fill: {
                type: "gradient",
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.7,
                  opacityTo: 0.2,
                },
              },
              colors: ['#3C50E0', '#10B981'],
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
                labels: { style: { colors: textColor } },
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
            height={350}
          />
        </div>

        {/* Stock Opname Progress */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h2 className="mb-6 text-xl font-semibold text-black dark:text-white">
            Progress Stock Opname
          </h2>
          <Chart
            options={{
              chart: {
                type: "area",
                height: 350,
                toolbar: { show: false },
                zoom: { enabled: false },
                background: 'transparent',
              },
              theme: chartTheme,
              dataLabels: { enabled: false },
              stroke: {
                curve: "smooth",
                width: 3,
              },
              fill: {
                type: "gradient",
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.7,
                  opacityTo: 0.2,
                },
              },
              colors: ['#F59E0B', '#8B5CF6'],
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
                labels: { style: { colors: textColor } },
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
            type="area"
            height={350}
          />
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Aktivitas Sistem
            </h2>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray hover:bg-gray-2 dark:bg-meta-4 dark:hover:bg-meta-4/80">
              <Activity className="h-5 w-5 text-bodydark dark:text-bodydark" />
            </button>
          </div>

          {/* Active Opname Summary */}
          {activeOpname.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-medium text-black dark:text-white">
                Stock Opname Aktif
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeOpname.map((opname) => (
                  <div
                    key={opname.batch_id}
                    className="rounded-xl border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-black dark:text-white">
                          {opname.nama_batch}
                        </h4>
                        <p className="mt-1 text-sm text-bodydark">
                          Dibuat oleh {opname.created_by}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {opname.tipe_opname}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-bodydark">Progress</span>
                        <span className="font-medium text-black dark:text-white">
                          {opname.completed_assignments}/{opname.total_assignments} tugas
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-stroke dark:bg-strokedark">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${
                              (opname.completed_assignments / opname.total_assignments) * 100 || 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="flow-root">
            <ul className="-mb-8">
              {activityFeed.slice(0, 5).map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < activityFeed.slice(0, 5).length - 1 && (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-stroke dark:bg-strokedark" />
                    )}
                    <div className="relative flex space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-4 ring-white dark:ring-boxdark">
                        {activity.type === "product" ? (
                          <Package className="h-4 w-4 text-primary" />
                        ) : activity.type === "user" ? (
                          <Users className="h-4 w-4 text-meta-3" />
                        ) : (
                          <ClipboardList className="h-4 w-4 text-meta-6" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4">
                        <div>
                          <p className="text-sm text-bodydark">
                            {activity.description}
                            <span className="ml-1 font-medium text-black dark:text-white">
                              by {activity.user.name}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-bodydark">
                            {activity.user.role}
                            {activity.user.division && ` • ${activity.user.division}`}
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-bodydark">
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
      </div>
    </div>
  );
}

export const DashboardClient = withAuth(DashboardClientComponent);
