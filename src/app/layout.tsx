import { ClientShell } from '@/components/ClientShell';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'SIM-SARPRAS | Sistem Layanan Peminjaman, Inventarisasi & Perawatan Kampus',
  description: 'Sistem Informasi Manajemen Terpadu Sarana dan Prasarana Kampus. Pengajuan peminjaman mobil dinas, ruang kelas, dan aula tanpa login, persetujuan bertingkat Staff & Kepala Sarpras, serta pemeliharaan aset elektronik, mesin, dan kelistrikan.',
  icons: {
    icon: '/logo-universitas.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
