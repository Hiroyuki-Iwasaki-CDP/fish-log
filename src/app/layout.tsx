import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/store';
import { AuthGate } from '@/components/AuthGate';
import { Shell } from '@/components/Shell';
import { ServiceWorker } from '@/components/ServiceWorker';
export const metadata: Metadata = { title: 'FISH LOG | 釣れた瞬間を、データにする。', description: '自分だけの釣果記録と振り返り', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FISH LOG' }, manifest: '/manifest.webmanifest', icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#071624' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body><DataProvider><AuthGate><Shell>{children}</Shell></AuthGate></DataProvider><ServiceWorker/></body></html>; }
