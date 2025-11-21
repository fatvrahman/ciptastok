import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { LayoutWrapper } from "@/components/Layouts/layout-wrapper";

export const metadata: Metadata = {
  title: {
    template: "%s | CiptaStok - Sistem Inventory",
    default: "CiptaStok - Sistem Inventory",
  },
  description:
    "Sistem manajemen inventory dan stock opname untuk CiptaStok",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="bg-white">
        <Providers>
          <NextTopLoader color="#1A4D2E" showSpinner={false} />
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
