"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { LogOutIcon } from "./icons";

// Helper function untuk mendapatkan inisial nama
const getInitials = (name: string) => {
  if (!name) return "U";
  const nameParts = name.trim().split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const USER = {
    name: user?.nama_lengkap || "User",
    email: user?.email || "user@ciptastok.com",
    role: user?.nama_role || "User",
    initials: getInitials(user?.nama_lengkap || "User"),
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#1A4D2E] text-white font-semibold text-sm">
            {USER.initials}
          </div>
          <figcaption className="flex items-center gap-1 font-medium text-black max-[1024px]:sr-only">
            <span>{USER.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform text-gray-600",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#1A4D2E] text-white font-semibold text-lg">
            {USER.initials}
          </div>

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-black dark:text-white">
              {USER.name}
            </div>
            <div className="text-xs leading-none text-gray-6">{USER.role}</div>
            <div className="leading-none text-gray-6">{USER.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleLogout}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
