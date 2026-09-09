'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileCheck2, 
  Car, 
  Printer, 
  Calendar, 
  User, 
  Phone, 
  Building2, 
  Info, 
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Download
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { OfficialLetterModal } from '@/components/OfficialLetterModal';

interface LoanDetail {
  id: string;
  ticket_code: string;
  borrower_name: string;
  borrower_id: string;
  borrower_role: string;
  borrower_phone: string;
  borrower_email?: string;
  asset_id: string;
  asset_name: string;
  asset_code: string;
  asset_category: string;
  asset_location: string;
  asset_specs?: string;
  asset_condition?: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  purpose: string;
  destination?: string;
  driver_needed?: number;
  status: string;
  staff_notes?: string;
  head_notes?: string;
  staff_checklist?: string;
  head_checklist?: string;
  return_checklist?: string;
  staff_verified_at?: string;
  staff_verified_by?: string;
  head_approved_at?: string;
  head_approved_by?: string;
  picked_up_at?: string;
  returned_at?: string;
  created_at: string;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialTicket = searchParams.get('ticket') || '';

  const [inputTicket, setInputTicket] = useState(initialTicket);
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);

  const fetchLoan = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/loans/${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Data tiket tidak ditemukan');
      }

      setLoan(data.loan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melacak tiket';
      setErrorMsg(msg);
      setLoan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicket) {
      fetchLoan(initialTicket);
    }
  }, [initialTicket]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLoan(inputTicket);
  };

  // Parse checklists
  const staffCheck = loan?.staff_checklist ? JSON.parse(loan.staff_checklist) : null;
  const headCheck = loan?.head_checklist ? JSON.parse(loan.head_checklist) : null;
  const returnCheck = loan?.return_checklist ? JSON.parse(loan.return_checklist) : null;

  // Timeline Step Status Helper
  const getStepStatus = (stepIndex: number) => {
    if (!loan) return 'inactive';

    if (loan.status === 'REJECTED') {
      if (stepIndex === 1) return 'completed';
      if (stepIndex === 2 && !loan.staff_verified_at) return 'rejected';
      if (stepIndex === 3 && loan.staff_verified_at && !loan.head_approved_at) return 'rejected';
      return 'inactive';
    }

    // Step 1: Diajukan
    if (stepIndex === 1) return 'completed';

    // Step 2: Verifikasi Staff
    if (stepIndex === 2) {
      if (loan.status === 'PENDING_STAFF') return 'current';
      if (['PENDING_HEAD', 'APPROVED', 'IN_USE', 'RETURNED'].includes(loan.status)) return 'completed';
      return 'inactive';
    }

    // Step 3: Persetujuan Kepala
    if (stepIndex === 3) {
      if (loan.status === 'PENDING_HEAD') return 'current';
      if (['APPROVED', 'IN_USE', 'RETURNED'].includes(loan.status)) return 'completed';
      return 'inactive';
    }

    // Step 4: Serah Terima / Penggunaan
    if (stepIndex === 4) {
      if (loan.status === 'APPROVED') return 'ready';
      if (loan.status === 'IN_USE') return 'current';
      if (loan.status === 'RETURNED') return 'completed';
      return 'inactive';
    }

    // Step 5: Pengembalian
    if (stepIndex === 5) {
      if (loan.status === 'RETURNED') return 'completed';
      return 'inactive';
    }

    return 'inactive';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Search Box */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="max-w-2xl">
          <span className="text-blue-300 font-bold text-xs uppercase tracking-wider">
            Portal Pelacakan Terbuka
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Lacak Status Permohonan Peminjaman
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Ketikkan nomor tiket peminjaman (contoh: <code className="text-sky-300 font-mono">SARPRAS-2026-0001</code>) untuk memantau status verifikasi Staff dan persetujuan Kepala Sarpras.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputTicket}
                onChange={(e) => setInputTicket(e.target.value)}
                placeholder="Masukkan Kode Tiket (misal: SARPRAS-2026-0002)..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mencari...' : 'Cek Status'}
            </button>
          </form>

          {/* Quick Demo links */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Contoh Tiket Demo:</span>
            <button
              type="button"
              onClick={() => {
                setInputTicket('SARPRAS-2026-0001');
                fetchLoan('SARPRAS-2026-0001');
              }}
              className="text-sky-300 hover:underline font-mono"
            >
              SARPRAS-2026-0001 (Menunggu Staff)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setInputTicket('SARPRAS-2026-0002');
                fetchLoan('SARPRAS-2026-0002');
              }}
              className="text-sky-300 hover:underline font-mono"
            >
              SARPRAS-2026-0002 (Menunggu Kepala)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setInputTicket('SARPRAS-2026-0003');
                fetchLoan('SARPRAS-2026-0003');
              }}
              className="text-sky-300 hover:underline font-mono"
            >
              SARPRAS-2026-0003 (Disetujui / Approved)
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Data Tidak Ditemukan</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loan Details View */}
      {loan && (
        <div className="space-y-8">
          {/* Status Banner */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                  {loan.ticket_code}
                </span>
                <StatusBadge status={loan.status} type="loan" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Peminjaman: {loan.asset_name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Diajukan oleh: <span className="font-semibold text-slate-700">{loan.borrower_name}</span> ({loan.borrower_role}) pada {loan.created_at}
              </p>
            </div>

            {/* If approved, show Print Certificate button */}
            {loan.status === 'APPROVED' && (
              <button
                type="button"
                onClick={() => setShowLetterModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat Izin Resmi (QR)</span>
              </button>
            )}
          </div>

          {/* Timeline Process Tracker */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-6">
              Progres Persetujuan Bertingkat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
              {/* Step 1: Diajukan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">1. Pengajuan Masuk</h4>
                <p className="text-[11px] text-slate-500">Berhasil Diterima Sistem</p>
              </div>

              {/* Step 2: Verifikasi Staff */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus(2) === 'completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : getStepStatus(2) === 'current'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400'
                  : getStepStatus(2) === 'rejected'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                  getStepStatus(2) === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : getStepStatus(2) === 'current'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : getStepStatus(2) === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-300 text-white'
                }`}>
                  {getStepStatus(2) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                </div>
                <h4 className="font-bold text-xs">2. Verifikasi Staff</h4>
                <p className="text-[11px]">
                  {getStepStatus(2) === 'completed' ? 'Kondisi & Jadwal Valid' : getStepStatus(2) === 'current' ? 'Sedang Diperiksa Staff' : 'Menunggu'}
                </p>
              </div>

              {/* Step 3: Persetujuan Kepala */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus(3) === 'completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : getStepStatus(3) === 'current'
                  ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-400'
                  : getStepStatus(3) === 'rejected'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                  getStepStatus(3) === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : getStepStatus(3) === 'current'
                    ? 'bg-purple-600 text-white animate-pulse'
                    : getStepStatus(3) === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-300 text-white'
                }`}>
                  {getStepStatus(3) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : '3'}
                </div>
                <h4 className="font-bold text-xs">3. Persetujuan Kepala</h4>
                <p className="text-[11px]">
                  {getStepStatus(3) === 'completed' ? 'Disetujui Resmi' : getStepStatus(3) === 'current' ? 'Menunggu Kepala Sarpras' : 'Menunggu'}
                </p>
              </div>

              {/* Step 4: Serah Terima */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus(4) === 'completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : getStepStatus(4) === 'current'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-400'
                  : getStepStatus(4) === 'ready'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                  getStepStatus(4) === 'completed' || getStepStatus(4) === 'ready'
                    ? 'bg-emerald-600 text-white'
                    : getStepStatus(4) === 'current'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-300 text-white'
                }`}>
                  {getStepStatus(4) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : '4'}
                </div>
                <h4 className="font-bold text-xs">4. Serah Terima</h4>
                <p className="text-[11px]">
                  {loan.status === 'APPROVED' ? 'Siap Diambil' : loan.status === 'IN_USE' ? 'Sedang Digunakan' : getStepStatus(4) === 'completed' ? 'Telah Diambil' : 'Menunggu'}
                </p>
              </div>

              {/* Step 5: Pengembalian */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus(5) === 'completed'
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                  getStepStatus(5) === 'completed' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-white'
                }`}>
                  {getStepStatus(5) === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : '5'}
                </div>
                <h4 className="font-bold text-xs">5. Selesai</h4>
                <p className="text-[11px]">
                  {loan.status === 'RETURNED' ? 'Telah Dikembalikan' : 'Menunggu'}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist Verification Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Staff Verification Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900">Checklist Verifikasi Staff Sarpras</h4>
                </div>
                {loan.staff_verified_at ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Selesai Diverifikasi
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    Dalam Antrean Staff
                  </span>
                )}
              </div>

              {staffCheck ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Ketersediaan Unit & Jadwal:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi Aman
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Kondisi Fisik / Kelaikan Sarpras:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Kondisi Baik
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Kesiapan BBM / Driver / Kunci:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Siap
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                    <span className="font-bold text-slate-700 block mb-1">Catatan Staff Sarpras:</span>
                    <p className="text-slate-600">{loan.staff_notes || staffCheck.notes || '-'}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Diverifikasi oleh: {loan.staff_verified_by || 'Staff Sarpras'} pada {loan.staff_verified_at}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Belum ada checklist dari staff. Pengajuan masih dalam antrean review.
                </p>
              )}
            </div>

            {/* Head of Sarpras Approval Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Persetujuan Kepala Sarpras</h4>
                </div>
                {loan.head_approved_at ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Disetujui Resmi
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    Menunggu Keputusan
                  </span>
                )}
              </div>

              {headCheck ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Skala Prioritas Kegiatan Kampus:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Disetujui
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Persetujuan Alokasi Waktu:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Disetujui
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                    <span className="font-bold text-slate-700 block mb-1">Disposisi / Catatan Kepala:</span>
                    <p className="text-slate-600">{loan.head_notes || headCheck.notes || '-'}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Disetujui oleh: {loan.head_approved_by || 'Dr. Ir. Hendra Wijaya, M.T.'} pada {loan.head_approved_at}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Menunggu verifikasi staff selesai terlebih dahulu sebelum diputuskan oleh Kepala Bagian Sarpras.
                </p>
              )}
            </div>
          </div>

          {/* Details Summary Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Rincian Pengajuan Peminjaman
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500">Nama Pemohon:</span>
                <p className="font-semibold text-slate-800 text-sm">{loan.borrower_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">NIM / NIP & Status:</span>
                <p className="font-semibold text-slate-800 text-sm">{loan.borrower_id} ({loan.borrower_role})</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">No. WhatsApp Pemohon:</span>
                <p className="font-semibold text-slate-800 text-sm">{loan.borrower_phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Sarpras yang Dipinjam:</span>
                <p className="font-semibold text-blue-900 text-sm">{loan.asset_name} ({loan.asset_code})</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Waktu Pelaksanaan:</span>
                <p className="font-semibold text-slate-800 text-sm">
                  {loan.start_date} ({loan.start_time}) s/d {loan.end_date} ({loan.end_time})
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Lokasi / Rute Tujuan:</span>
                <p className="font-semibold text-slate-800 text-sm">{loan.destination || loan.asset_location}</p>
              </div>
              <div className="sm:col-span-2 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">Keperluan / Agenda:</span>
                <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">{loan.purpose}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {loan && (
        <OfficialLetterModal
          loan={loan}
          isOpen={showLetterModal}
          onClose={() => setShowLetterModal(false)}
        />
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat halaman pelacakan...</div>}>
      <TrackingContent />
    </Suspense>
  );
}

