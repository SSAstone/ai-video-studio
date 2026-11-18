import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Video Studio - CapCut-style AI Video Editor',
  description: 'Browser-based AI Video Editor SaaS with multi-track timeline and smart AI automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}

