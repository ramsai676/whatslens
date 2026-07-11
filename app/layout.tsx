import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'WhatsLens — your WhatsApp already knows your best customers',
  description:
    'Drop your WhatsApp chat exports and see your VIPs, dormant customers, hot leads and upcoming events. 100% in your browser — nothing is uploaded, ever.',
};

const themeInit = `
try {
  var t = localStorage.getItem('wl-theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
