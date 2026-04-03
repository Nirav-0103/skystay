/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.0.0.2'],

  // Proxy /api/* → EC2 backend (fixes HTTP/HTTPS mixed content)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:10000/api/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = nextConfig;