"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";
import logoImage from "@/assets/logos/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear old session on mount (fresh login page load)
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionStart");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("sessionStart", Date.now().toString());
        localStorage.setItem("showWelcomeAlert", "true"); // Flag for dashboard
        
        // Redirect immediately to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.msg || "Login gagal. Periksa username dan password Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-6 py-20 md:px-20 lg:px-80 backdrop-blur-3xl bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2535&auto=format&fit=crop')"
      }}
    >
      <div className="w-full max-w-sm">
        {/* Glass Card */}
        <div className="px-8 md:px-12 py-12 flex flex-col items-center gap-12 w-full backdrop-blur-md rounded-2xl bg-white/25 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 w-full">
            <Image
              src={logoImage}
              alt="CiptaStok Logo"
              width={180}
              height={60}
              priority
              className="h-16 w-auto"
            />
            <div className="flex flex-col gap-2 w-full">
              <p className="text-center text-gray-800">
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col items-center gap-8 w-full">
            {error && (
              <div className="w-full rounded-full border border-red-400/50 bg-red-100/40 px-4 py-3">
                <p className="text-sm text-red-800 text-center font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
              {/* Username */}
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="appearance-none border border-white/30 w-full outline-none bg-white/20 text-gray-900 placeholder:text-gray-600 rounded-full px-12 py-3 shadow-sm focus:border-white/50 focus:ring-2 focus:ring-white/30 transition"
                />
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="appearance-none border border-white/30 w-full outline-none bg-white/20 text-gray-900 placeholder:text-gray-600 rounded-full px-12 py-3 shadow-sm focus:border-white/50 focus:ring-2 focus:ring-white/30 transition"
                />
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary border-2 border-primary text-white font-semibold py-3 hover:bg-[#1A4D2E]/90 hover:border-[#1A4D2E]/90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="w-full text-center space-y-1">
            <p className="text-gray-800 text-sm">
              © 2024 CiptaStok. All rights reserved.
            </p>
            <p className="text-gray-700 text-xs">
              Versi 1.0.0 • Dibuat oleh fatvrahman
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
