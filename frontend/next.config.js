/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.0.0.2'],

  // Proxy /api/* → AWS backend
  // Set BACKEND_URL in Vercel env vars: http://your-eb-url.elasticbeanstalk.com
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:10000';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
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