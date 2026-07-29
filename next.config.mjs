/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Immutable releases must not accumulate optimized image files on disk.
    maximumDiskCacheSize: 0
  }
};

export default nextConfig;
