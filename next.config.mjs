/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // The desktop shell's webview navigates to 127.0.0.1 while Next's dev
  // assets are requested relative to that origin — same host, just not
  // "localhost", which Next's dev-origin check treats as cross-origin.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
