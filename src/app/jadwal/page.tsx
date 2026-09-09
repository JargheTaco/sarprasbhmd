'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Car, 
  Building2, 
  Send, 
  CheckCircle2, 
  Search, 
  AlertCircle,
  Filter
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface LoanSchedule {
  id: string;
  ticket_code: string;
  borrower_name: string;
  borrower_role: string;
  asset_name: string;
  asset_code: string;
  asset_category: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  purpose: string;
  status: string;
}

export default function JadwalPage() {
  const [loans, setLoans] = useState<LoanSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/loans')
      .then((res) => res.json())
      .then((data) => {
        if (data?.loans) {
          // Only show active and approved/in-use or pending schedules
          const activeSchedules = data.loans.filter((l: LoanSchedule) =>
            ['PENDING_STAFF', 'PENDING_HEAD', 'APPROVED', 'IN_USE'].includes(l.status)
          );
          setLoans(activeSchedules);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLoans = loans.filter((l) => {
    const matchCat = filterCategory === 'ALL' || l.asset_category === filterCategory;
    const matchSearch =
      !search.trim() ||
      l.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      l.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
      l.purpose.toLowerCase().includes(search.toLowerCase()) ||
      l.ticket_code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
            Transparansi Jadwal Sarpras
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Kalender & Ketersediaan Sarpras
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Periksa jadwal penggunaan mobil kampus, ruang kuliah, dan aula untuk memastikan tidak terjadi bentrok saat mengajukan peminjaman.
          </p>
        </div>

        <Link
          href="/pinjam"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
          Ajukan Peminjaman
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Semua Jadwal', val: 'ALL' },
            { label: 'Mobil Kampus', val: 'VEHICLE' },
            { label: 'Ruang Kelas & Aula', val: 'ROOM' },
            { label: 'Elektronik & Lainnya', val: 'ELECTRONIC' },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => setFilterCategory(tab.val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterCategory === tab.val
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jadwal / unit..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Schedule Items List */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">Memuat kalender jadwal...</div>
      ) : filteredLoans.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Tidak ada agenda peminjaman aktif pada filter ini.</p>
          <p className="text-xs text-slate-400">Seluruh unit sarpras saat ini berstatus bebas / siap dipinjam.</p>
          <div className="pt-2">
            <Link
              href="/pinjam"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Ajukan Peminjaman Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                    {loan.asset_code}
                  </span>
                  <StatusBadge status={loan.status} type="loan" />
                  <span className="text-xs font-medium text-slate-400">
                    Tiket: {loan.ticket_code}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">
                  {loan.asset_name}
                </h3>

                <p className="text-xs text-slate-600">
                  Agenda: <span className="font-medium text-slate-800">{loan.purpose}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {loan.start_date} ({loan.start_time}) s/d {loan.end_date} ({loan.end_time})
                  </span>
                  <span>
                    Pemohon: <span className="font-semibold text-slate-700">{loan.borrower_name}</span> ({loan.borrower_role})
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href={`/tracking?ticket=${loan.ticket_code}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Detail Pelacakan
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

