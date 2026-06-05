import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { getLocale } from "gt-next/server";
import { GTProvider } from "gt-next";

export const metadata: Metadata = {
  metadataBase: new URL('https://nps-city-game.netlify.app'),
  title: {
    default: 'NPS City — Metropolis Builder',
    template: 'NPS City — %s',
  },
  description: 'A richly detailed isometric city builder. Build your metropolis and manage resources with cars, planes, helicopters, boats, trains, citizens, and more.',
  openGraph: {
    title: 'NPS City — Metropolis Builder',
    description: 'A richly detailed isometric city builder. Build your metropolis and manage resources with cars, planes, helicopters, boats, trains, citizens, and more.',
    type: 'website',
    siteName: 'NPS City',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1179,
        height: 1406,
        type: 'image/png',
        alt: 'NPS City - Isometric city builder game screenshot'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NPS City'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#eaf6ff'
};

export default async function RootLayout({ children }: {children: React.ReactNode;}) {
  return (
  <html lang={await getLocale()}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/assets/buildings/residential.png" />
        {/* Preload critical game assets - WebP for browsers that support it */}
        <link
        rel="preload"
        href="/assets/sprites_red_water_new.webp"
        as="image"
        type="image/webp" />

        <link
        rel="preload"
        href="/assets/water.webp"
        as="image"
        type="image/webp" />

      </head>
      <body className="bg-background text-foreground antialiased font-sans overflow-hidden"><GTProvider>{children}<Analytics /></GTProvider></body>
    </html>
  );
}
