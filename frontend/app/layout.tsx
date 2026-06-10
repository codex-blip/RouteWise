/**
 * Root Layout Component
 *
 * Wraps all pages with common providers and HTML structure.
 * In Step 4, this will wrap authentication providers.
 * In Step 2, this will wrap WebSocket providers.
 */
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uber Clone - Ride Hailing App',
  description: 'A full-stack Uber clone built with Next.js and FastAPI',
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
    <html lang="en">
      <head>
        {/* Mapbox CSS - Required for map controls */}
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-black">
        {/*
          TODO Step 4: Wrap with Authentication Provider
          <AuthProvider>
            {children}
          </AuthProvider>
        */}

        {/*
          TODO Step 2: Wrap with WebSocket Provider
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        */}

        {children}
      </body>
    </html>
  );
}
