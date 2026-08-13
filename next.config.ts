import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://vercel.live https://*.vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://i.ytimg.com https://img.youtube.com data: blob:",
      "media-src 'self'",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://www.youtube.com https://vercel.live https://*.vercel.live",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://vercel.live https://*.vercel.live",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["cachyos"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;