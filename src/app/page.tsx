'use client';

import { StatusBadge } from '@/components/StatusBadge';
import {
    Activity,
    ArrowRight,
    Building2,
    Calendar,
    Car,
    CheckCircle2,
    FileCheck2,
    Search,
    Send,
    Sparkles,
    Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  location: string;
  condition: string;
  status: string;
  specs: string;
  capacity: number;
}

interface StatsData {
  assets: {
    total: number;
    vehicles: number;
    rooms: number;
    maintenance_category: number;
    available: number;
  };
  loans: {
    pending_staff: number;
    pending_head: number;
    approved: number;
    in_use: number;
    total_active: number;
  };
  maintenance: {
    active: number;
  };
}

export default function HomePage() {
  const router = useRouter();
  const [searchTicket, setSearchTicket] = useState('');
  const [featuredAssets, setFeaturedAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/assets?status=TERSEDIA').then((res) => res.json()),
      fetch('/api/stats').then((res) => res.json()),
    ])
      .then(([assetsData, statsData]) => {
        if (assetsData?.assets) {
          setFeaturedAssets(assetsData.assets.slice(0, 4));
        }
        if (statsData?.stats) {
          setStats(statsData.stats);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicket.trim()) return;
    router.push(`/tracking?ticket=${encodeURIComponent(searchTicket.trim())}`);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto text-center space-y-8">
          {/* Badge Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md text-blue-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Layanan Terpadu Sarana & Prasarana Universitas Bhamada Slawi
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Peminjaman Sarpras Universitas Bhamada Slawi <br className="hidden sm:inline" />
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Ajukan peminjaman mobil dinas kampus, ruang kelas, aula, auditorium, hingga perlengkapan pembelajaran secara langsung. Dilengkapi sistem persetujuan bertingkat Staff & Kepala Sarpras secara transparan.
          </p>

          {/* Quick Tracking Search Bar */}
          <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  placeholder="Masukkan Kode Tiket (misal: SARPRAS-2026-0001)..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/40 hover:shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Lacak Tiket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/pinjam"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
            >
              <Send className="w-4 h-4" />
              Ajukan Peminjaman Sekarang
            </Link>
            <Link
              href="/jadwal"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              Lihat Kalender Ketersediaan
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-800 text-left">
            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Car className="w-4 h-4 text-blue-400" />
                <span>Mobil Kampus</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : `${stats?.assets.vehicles || 3} Unit`}
              </p>
              <span className="text-[11px] text-emerald-400">Siap Operasional</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Ruang & Aula</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : `${stats?.assets.rooms || 3} Ruangan`}
              </p>
              <span className="text-[11px] text-emerald-400">Kapasitas s/d 500 org</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Peminjaman Aktif</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : `${stats?.loans.total_active || 3} Agenda`}
              </p>
              <span className="text-[11px] text-blue-300">Terjadwal Terverifikasi</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Perawatan Rutin</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : `${stats?.maintenance.active || 2} Unit`}
              </p>
              <span className="text-[11px] text-amber-300">Elektronik & Mesin</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Main Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Peminjaman Publik */}
          <div className="bg-white rounded-2xl p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80 hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Layanan Peminjaman Publik
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Mahasiswa, Dosen, dan Ormawa dapat mengajukan izin peminjaman mobil dinas kampus, ruang kuliah/aula, dan proyektor tanpa harus mendaftar akun atau login.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Formulir cepat tanpa registrasi akun</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Pengecekan bentrok jadwal otomatis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Kode tiket pelacakan real-time</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Persetujuan Bertingkat */}
          <div className="bg-white rounded-2xl p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80 hover:border-indigo-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Persetujuan Bertingkat (Approval)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Pemeriksaan ketat oleh Staff Sarpras (cek ketersediaan & kondisi fisik) dilanjutkan persetujuan resmi Kepala Sarpras melalui checklist digital.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Login khusus Staff & Kepala Sarpras</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Checklist kelaikan sarpras & supir dinas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Surat Izin resmi otomatis ber-QR Code</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Maintenance & Inventaris */}
          <div className="bg-white rounded-2xl p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80 hover:border-amber-300 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Perawatan Elektronik, Mesin & Listrik
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Sistem pencatatan terstruktur untuk pemeliharaan preventif dan perbaikan insidental alat pembelajaran elektronik, mesin lab/workshop, dan genset kampus.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Jadwal servis preventif proyektor & genset</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tiket kerusakan & log pergantian spare part</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Inventarisasi kondisi & arsip aset kampus</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Workflow Step-by-Step Infographic */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
            Alur Pengajuan Transparan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Cara Pinjam Sarpras Kampus Tanpa Login
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Ikuti 4 langkah sederhana dari pengajuan hingga pengambilan unit
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4">
              01
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Pilih Sarpras & Isi Form</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tentukan mobil, ruang kelas, atau alat yang dibutuhkan. Masukkan identitas Anda (NIM/NIP) serta tanggal kegiatan.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">
              02
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Terima Kode Tiket</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem langsung menerbitkan Kode Tiket Pelacakan (misal: <code className="text-blue-600 font-mono">SARPRAS-2026-0001</code>) untuk memantau status secara live.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm mb-4">
              03
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Verifikasi Staff & Kepala</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Staff memeriksa kesiapan unit dan sopir, lalu Kepala Sarpras menyetujui izin penggunaan secara digital.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-4">
              04
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Cetak Surat & Ambil Unit</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unduh Surat Izin resmi ber-QR Code di halaman pelacakan, dan serahkan ke bagian Sarpras saat pengambilan kunci/barang.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Available Assets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
              Katalog Siap Pakai
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Sarana Prasarana Populer
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Unit armada, ruang kuliah, dan peralatan yang berstatus siap dipinjam hari ini
            </p>
          </div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>Lihat Semua Katalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {asset.code}
                  </span>
                  <StatusBadge status={asset.status} type="asset" />
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1.5 line-clamp-2">
                  {asset.name}
                </h3>

                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{asset.location}</span>
                </p>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 mb-4">
                  {asset.specs || 'Spesifikasi lengkap tersedia di katalog.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {asset.capacity > 0 ? `Kapasitas: ${asset.capacity} Org` : 'Unit Tunggal'}
                </span>
                <Link
                  href={`/pinjam?asset_id=${asset.id}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  Pinjam
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Punya Agenda Kegiatan Kampus?
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Ajukan permohonan sekarang untuk memastikan ketersediaan armada mobil dinas, aula, atau laboratorium agar tidak berbenturan dengan agenda lain.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/pinjam"
              className="px-6 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all text-center"
            >
              Buka Form Pengajuan
            </Link>
            <Link
              href="/tracking"
              className="px-6 py-3.5 rounded-xl bg-blue-800/80 hover:bg-blue-900 text-white font-semibold text-sm border border-blue-400/30 transition-colors text-center"
            >
              Cek Status Tiket Anda
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
