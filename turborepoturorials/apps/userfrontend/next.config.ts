import type { NextConfig } from "next";

const adminSecurityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  devIndicators: false as any,
  async headers() {
    return [
      // Keep in sync with ADMIN_BASE_PATH in services/adminRoutes.ts
      { source: "/grassroots-admin", headers: adminSecurityHeaders },
      { source: "/grassroots-admin/:path*", headers: adminSecurityHeaders },
    ];
  },
};

export default nextConfig;
