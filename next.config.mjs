/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Local disk uploads + seed art are already right-sized; swap to an
    // S3/Cloudinary loader in production.
    unoptimized: true,
    remotePatterns: [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
