// src/app/page.tsx
import RootRedirect from "@/components/RootRedirect";

// INI KUNCI PERBAIKANNYA:
// Memaksa halaman ini dirender secara dynamic (server-side) saat build
// sehingga Next.js tidak mencoba generate static HTML yang bikin crash.
export const dynamic = "force-dynamic";

export default function RootPage() {
  return <RootRedirect />;
}