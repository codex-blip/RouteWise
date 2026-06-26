import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'RouteWise - Ride Hailing App',
  description: 'A full-stack RouteWise app built with Next.js, Clerk and FastAPI',
  keywords: ['uber', 'rideshare', 'taxi', 'transportation'],
  authors: [{ name: 'Developer' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Mapbox CSS - Required for map controls */}
          <link
            href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
            rel="stylesheet"
          />
        </head>
        <body className="antialiased bg-[#050505] text-white">
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

