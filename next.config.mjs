/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'thumb.wikimedia.org' },
    ],
  },
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
};

export default nextConfig;
