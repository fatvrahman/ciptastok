"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Custom event for cross-tab logout
const LOGOUT_EVENT = "user-logout";

export function withAuth(Component: React.ComponentType<any>) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Check authentication
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const sessionStart = localStorage.getItem("sessionStart");
      
      // Check if session expired (8 hours - match dengan backend JWT expiry)
      const now = Date.now();
      if (sessionStart) {
        const sessionAge = now - parseInt(sessionStart);
        const maxAge = 8 * 60 * 60 * 1000; // 8 hours
        
        if (sessionAge > maxAge) {
          // Session expired, clear and redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("sessionStart");
          router.push("/login");
          setIsLoading(false);
          return;
        }
      }

      if (!token || !user) {
        // Clear any stale data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("sessionStart");
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);

      // Listen for storage changes (cross-tab logout)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "token" && e.newValue === null) {
          // Token removed in another tab, logout this tab too
          setIsAuthenticated(false);
          router.push("/login");
        }
      };

      // Listen for custom logout event (same tab, multiple components)
      const handleLogoutEvent = () => {
        setIsAuthenticated(false);
        router.push("/login");
      };

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener(LOGOUT_EVENT, handleLogoutEvent);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(LOGOUT_EVENT, handleLogoutEvent);
      };
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionStart");
    
    // Dispatch custom event for same-tab logout
    window.dispatchEvent(new Event(LOGOUT_EVENT));
    
    // Redirect to login
    window.location.href = "/login";
  };

  return { user, logout };
}
