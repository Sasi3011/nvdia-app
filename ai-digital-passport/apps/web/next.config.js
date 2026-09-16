/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so this build can later be wrapped by Capacitor for
  // Android/iOS, while also being deployable as a plain static website.
  output: "export",
  reactStrictMode: true,
  images: {
    // next/image optimization requires a server; disabled for static export.
    unoptimized: true,
  },
  transpilePackages: ["@ai-digital-passport/shared-types"],
};

module.exports = nextConfig;
