import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "DASHBOARD",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
    ],
  },
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Monitoring Opname",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Daftar Monitoring",
            url: "/monitoring",
          },
          {
            title: "Assignment Baru",
            url: "/monitoring/baru",
          },
        ],
      },
      {
        title: "Manajemen Produk",
        icon: Icons.Table,
        items: [
          {
            title: "Daftar Produk",
            url: "/produk",
          },
          {
            title: "Tambah Produk",
            url: "/produk/baru",
          },
        ],
      },
      {
        title: "Riwayat Opname",
        icon: Icons.Calendar,
        items: [
          {
            title: "Daftar Riwayat",
            url: "/riwayat",
          },
        ],
      },
    ],
  },
  {
    label: "UTILITY",
    items: [
      {
        title: "Manajemen User",
        icon: Icons.User,
        items: [
          {
            title: "Daftar User",
            url: "/users",
          },
          {
            title: "Activity Log",
            url: "/users/log",
          },
        ],
      },
      {
        title: "Pengaturan",
        url: "/pengaturan",
        icon: Icons.Settings,
        items: [],
      },
    ],
  },
];
