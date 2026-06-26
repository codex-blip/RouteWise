/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development best practices
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    domains: ['api.mapbox.com', 'events.mapbox.com'],
  },

  // Environment variables exposed to the browser
  // These must be prefixed with NEXT_PUBLIC_ to be accessible client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },

  // TODO Step 2: Add WebSocket configuration
  // async rewrites() {
  //   return [
  //     {
  //       source: '/ws/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_WS_URL}/:path*`,
  //     },
  //   ];
  // },

  // Development configuration
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

module.exports = nextConfig;
