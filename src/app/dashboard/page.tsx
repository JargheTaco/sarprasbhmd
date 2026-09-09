'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileCheck2, 
  Clock, 
  Car, 
  Wrench, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Package, 
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface StatsResponse {
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
    returned: number;
    total_active: number;
  };
  maintenance: {
    scheduled: number;
    in_progress: number;
    completed: number;
    active: number;
  };
  recentLoans: Array<{
    id: string;
    ticket_code: string;
    borrower_name: string;
    borrower_role: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
    asset_name: string;
    asset_category: string;
  }>;
  recentMaintenances: Array<{
    id: string;
    ticket_number: string;
    title: string;
    category: string;
    status: string;
    scheduled_date: string;
    technician_name: string;
    asset_name: string;
    asset_code: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ])
      .then(([userData, statsData]) => {
        if (userData?.user) setUser(userData.user);
        if (statsData?.stats) setStats(statsData.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat statistik sistem...</div>;
  }

  const isStaff = user?.role === 'STAFF_SARPRAS' || user?.role === 'ADMIN';
  const isHead = user?.role === 'KEPALA_SARPRAS' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Role Action Hero Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/20">
              {user?.role === 'KEPALA_SARPRAS' ? 'Persetujuan Tingkat Kepala' : 'Verifikasi Tingkat Staff'}
            </span>
            <span className="text-xs text-slate-300">• SIM-SARPRAS Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {user?.role === 'KEPALA_SARPRAS'
              ? `Terdapat ${stats?.loans.pending_head || 0} pengajuan peminjaman yang telah diverifikasi oleh Staff Sarpras dan menunggu persetujuan akhir Anda.`
              : `Terdapat ${stats?.loans.pending_staff || 0} permohonan baru dari civitas kampus yang menunggu pemeriksaan kelayakan dan checklist Staff.`}
          </p>
        </div>

        <Link
          href="/dashboard/peminjaman"
          className="px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-2"
        >
          <span>Buka Meja Persetujuan</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Pending Staff */}
        <Link
          href="/dashboard/peminjaman?tab=staff"
          className={`p-5 rounded-2xl border transition-all ${
            (stats?.loans.pending_staff || 0) > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500">1. Antrean Verifikasi Staff</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.loans.pending_staff || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Checklist ketersediaan fisik</p>
        </Link>

        {/* Metric 2: Pending Head */}
        <Link
          href="/dashboard/peminjaman?tab=head"
          className={`p-5 rounded-2xl border transition-all ${
            (stats?.loans.pending_head || 0) > 0
              ? 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500">2. Menunggu Persetujuan Kepala</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.loans.pending_head || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Approval akhir & penerbitan izin</p>
        </Link>

        {/* Metric 3: Active In Use */}
        <Link
          href="/dashboard/peminjaman?tab=active"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500">3. Sedang Digunakan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {(stats?.loans.in_use || 0) + (stats?.loans.approved || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Armada & ruang terpakai</p>
        </Link>

        {/* Metric 4: Maintenance */}
        <Link
          href="/dashboard/perawatan"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-500">4. Perawatan Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.maintenance.active || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Elektronik, mesin & kelistrikan</p>
        </Link>
      </div>

      {/* Two Column Grid: Recent Loans & Recent Maintenances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Pengajuan Peminjaman Terkini */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">
                Pengajuan Peminjaman Terbaru
              </h3>
            </div>
            <Link
              href="/dashboard/peminjaman"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      {loan.ticket_code}
                    </span>
                    <StatusBadge status={loan.status} type="loan" />
                  </div>
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {loan.asset_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Oleh: {loan.borrower_name} ({loan.borrower_role}) • {loan.start_date}
                  </p>
                </div>

                <Link
                  href="/dashboard/peminjaman"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 shrink-0"
                >
                  Proses
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Perawatan Alat Terkini (Elektronik, Mesin, Listrik) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">
                Pemeliharaan Alat (Elektronik, Mesin, Listrik)
              </h3>
            </div>
            <Link
              href="/dashboard/perawatan"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Kelola &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentMaintenances.map((mnt) => (
              <div
                key={mnt.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      {mnt.ticket_number}
                    </span>
                    <StatusBadge status={mnt.status} type="maintenance" />
                  </div>
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {mnt.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Aset: {mnt.asset_name} • Teknisi: {mnt.technician_name}
                  </p>
                </div>

                <Link
                  href="/dashboard/perawatan"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 shrink-0"
                >
                  Update
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

