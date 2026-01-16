import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.huangcom.com',
      },
      {
        protocol: 'https',
        hostname: '*.mercadolibre.com',
      },
    ],
  },
}

export default nextConfig
