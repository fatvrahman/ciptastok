"use client";

import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { UserInfo } from "./user-info";

const MENU_ITEMS = [
  { title: "Dashboard", url: "/dashboard", group: "Dashboard" },
  { title: "Daftar Monitoring", url: "/monitoring", group: "Monitoring" },
  { title: "Assignment Baru", url: "/monitoring/baru", group: "Monitoring" },
  { title: "Daftar Produk", url: "/produk", group: "Manajemen Produk" },
  { title: "Tambah Produk", url: "/produk/baru", group: "Manajemen Produk" },
  { title: "Daftar Riwayat", url: "/riwayat", group: "Riwayat Opname" },
  { title: "Daftar User", url: "/users", group: "Manajemen User" },
  { title: "Activity Log", url: "/users/log", group: "Manajemen User" },
];

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const router = useRouter();
  const [dateTime, setDateTime] = useState({ date: "", time: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredMenus = MENU_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      const dayName = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      setDateTime({
        date: `${dayName}, ${date} ${month} ${year}`,
        time: `${hours}:${minutes}`
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-4 z-50 mx-4 flex items-center justify-between rounded-2xl bg-white/40 backdrop-blur-3xl backdrop-saturate-200 shadow-sm px-4 py-3 md:px-6 2xl:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-1.5 py-1 lg:hidden"
        >
          <MenuIcon />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        {isMobile && (
          <Link href={"/"} className="max-[430px]:hidden">
            <Image
              src={"/images/logo/logo-icon.svg"}
              width={32}
              height={32}
              alt=""
              role="presentation"
            />
          </Link>
        )}

        {/* Date and Time Display */}
        <div className="flex flex-col max-sm:hidden">
          <span className="text-sm font-semibold text-gray-900">{dateTime.date}</span>
          <span className="text-xs text-gray-500">{dateTime.time}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 min-[375px]:gap-4">
        {/* Searchbar with dropdown */}
        <div ref={searchRef} className="relative w-full max-w-[300px] max-sm:hidden">
          <input
            type="search"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="flex w-full items-center gap-3.5 rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 outline-none transition-colors text-black placeholder:text-gray-400 focus-visible:border-[#1A4D2E] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A4D2E]/20"
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          
          {/* Dropdown Menu */}
          {isSearchOpen && (searchQuery || filteredMenus.length > 0) && (
            <div className="absolute top-full mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-96 overflow-y-auto z-50">
              {filteredMenus.length > 0 ? (
                <ul className="py-2">
                  {filteredMenus.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => {
                          router.push(item.url);
                          setSearchQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-[#1A4D2E]/5 transition-colors"
                      >
                        <div className="text-sm font-medium text-black">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.group}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Tidak ada menu ditemukan
                </div>
              )}
            </div>
          )}
        </div>

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
