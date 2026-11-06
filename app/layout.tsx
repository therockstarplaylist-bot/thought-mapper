import './globals.css';
export const metadata = { title: 'Thought Mapper', description: 'Map how you think — one Generate at a time.', manifest: '/manifest.json' };
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0d12' };
export default function L({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
