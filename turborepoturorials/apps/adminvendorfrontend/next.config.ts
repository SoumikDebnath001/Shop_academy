import type { NextConfig } from "next";

// An admin panel should never be indexed or framed.
const adminSecurityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: adminSecurityHeaders }];
  },
};

export default nextConfig;
