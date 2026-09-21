'use client';

import { OfficialLetterModal } from '@/components/OfficialLetterModal';
import { StatusBadge } from '@/components/StatusBadge';
import {
    AlertCircle,
    Calendar,
    Car,
    CheckCircle2,
    CheckSquare,
    Clock,
    Layers,
    Phone,
    Printer,
    RotateCcw,
    Search,
    ShieldCheck,
    User,
    XCircle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface LoanItem {
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
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  purpose: string;
  destination?: string;
  driver_needed?: number;
  attachment_url?: string;
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

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';
}

function PeminjamanContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'staff';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  // Staff Form Checklist
  const [staffCheck, setStaffCheck] = useState({
    unit_available: true,
    physical_condition_ok: true,
    fuel_or_key_ready: true,
    documents_complete: true,
    notes: '',
  });

  // Head Form Checklist
  const [headCheck, setHeadCheck] = useState({
    priority_approved: true,
    schedule_approved: true,
    notes: '',
  });

  // Return Form Checklist
  const [returnCheck, setReturnCheck] = useState({
    condition_ok: true,
    cleanliness_ok: true,
    fuel_ok: true,
    notes: '',
    create_maintenance_ticket: false,
    maintenance_description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, loansRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/loans'),
      ]);
      const userData = await userRes.json();
      const loansData = await loansRes.json();

      if (userData?.user) setUser(userData.user);
      if (loansData?.loans) setLoans(loansData.loans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter loans based on active tab
  const filteredLoans = loans.filter((l) => {
    const matchSearch =
      !search.trim() ||
      l.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      l.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
      l.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      l.purpose.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'staff') return l.status === 'PENDING_STAFF';
    if (activeTab === 'head') return l.status === 'PENDING_HEAD';
    if (activeTab === 'active') return l.status === 'APPROVED' || l.status === 'IN_USE';
    if (activeTab === 'archive') return l.status === 'RETURNED' || l.status === 'REJECTED';
    return true;
  });

  // Handle Staff Verification
  const handleStaffSubmit = async (action: 'FORWARD' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/loans/${selectedLoan.ticket_code}/staff-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: staffCheck.notes,
          unit_available: staffCheck.unit_available,
          physical_condition_ok: staffCheck.physical_condition_ok,
          fuel_or_key_ready: staffCheck.fuel_or_key_ready,
          documents_complete: staffCheck.documents_complete,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses verifikasi');

      setStaffModalOpen(false);
      setSelectedLoan(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Head Approval
  const handleHeadSubmit = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/loans/${selectedLoan.ticket_code}/head-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: headCheck.notes,
          priority_approved: headCheck.priority_approved,
          schedule_approved: headCheck.schedule_approved,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses persetujuan kepala');

      setHeadModalOpen(false);
      setSelectedLoan(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Dispatch (Handover keys/unit)
  const handleDispatch = (loan: LoanItem) => {
    setSelectedLoan(loan);
    setDispatchModalOpen(true);
    setActionError(null);
  };

  const handleDispatchConfirm = async () => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/loans/${selectedLoan.ticket_code}/dispatch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses serah terima');
      setDispatchModalOpen(false);
      setSelectedLoan(null);
      await fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal serah terima');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Return Submission
  const handleReturnSubmit = async () => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/loans/${selectedLoan.ticket_code}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnCheck),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pengembalian');

      setReturnModalOpen(false);
      setSelectedLoan(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal pengembalian';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Count metrics
  const countStaff = loans.filter((l) => l.status === 'PENDING_STAFF').length;
  const countHead = loans.filter((l) => l.status === 'PENDING_HEAD').length;
  const countActive = loans.filter((l) => l.status === 'APPROVED' || l.status === 'IN_USE').length;
  const countArchive = loans.filter((l) => l.status === 'RETURNED' || l.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Meja Kerja Persetujuan & Peminjaman Sarpras
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Alur persetujuan bertingkat: Verifikasi Staff $\rightarrow$ Persetujuan Kepala Sarpras $\rightarrow$ Serah Terima & Pengembalian.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari peminjam / tiket..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>1. Menunggu Verifikasi Staff</span>
          {countStaff > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === 'staff' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'}`}>
              {countStaff}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('head')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'head'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Menunggu Persetujuan Kepala</span>
          {countHead > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === 'head' ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-800'}`}>
              {countHead}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>3. Sedang Digunakan & Serah Terima</span>
          {countActive > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === 'active' ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
              {countActive}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'archive'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>4. Arsip & Riwayat ({countArchive})</span>
        </button>
      </div>

      {/* Main Table / Card List */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">Memuat data peminjaman...</div>
      ) : filteredLoans.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Tidak ada pengajuan pada antrean ini.</p>
          <p className="text-xs text-slate-400">Seluruh tugas verifikasi pada tab ini telah terselesaikan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Left Column info */}
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                    {loan.ticket_code}
                  </span>
                  <StatusBadge status={loan.status} type="loan" />
                  <span className="text-xs text-slate-400">
                    Diajukan: {loan.created_at}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{loan.asset_name}</span>
                    <span className="text-xs font-normal text-slate-500 font-mono">
                      ({loan.asset_code})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    Keperluan: <span className="font-medium text-slate-800">{loan.purpose}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pemohon: <b className="text-slate-700">{loan.borrower_name}</b> ({loan.borrower_role}) - {loan.borrower_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WA: <b className="text-slate-700">{loan.borrower_phone}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-900 font-medium">
                      Jadwal: {loan.start_date} ({loan.start_time}) s/d {loan.end_date} ({loan.end_time})
                    </span>
                  </div>
                </div>

                {/* Show verification notes if any */}
                {loan.staff_notes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Catatan Staff ({loan.staff_verified_by || 'Staff'}):</span> {loan.staff_notes}
                  </div>
                )}
                {loan.head_notes && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
                    <span className="font-bold text-purple-800">Catatan Kepala Sarpras ({loan.head_approved_by || 'Kepala'}):</span> {loan.head_notes}
                  </div>
                )}
              </div>

              {/* Action Buttons Column */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-48">
                {/* Staff Action Button */}
                {loan.status === 'PENDING_STAFF' && (
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setStaffModalOpen(true);
                      setActionError(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Checklist Staff</span>
                  </button>
                )}

                {/* Head Approval Action Button */}
                {loan.status === 'PENDING_HEAD' && (
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setHeadModalOpen(true);
                      setActionError(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Persetujuan Kepala</span>
                  </button>
                )}

                {/* Approved status: Dispatch / Handover */}
                {loan.status === 'APPROVED' && (
                  <>
                    <button
                      onClick={() => handleDispatch(loan)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Car className="w-4 h-4" />
                      <span>Serah Terima Unit</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setLetterModalOpen(true);
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>Cetak Surat Izin</span>
                    </button>
                  </>
                )}

                {/* In Use status: Return checklist */}
                {loan.status === 'IN_USE' && (
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setReturnModalOpen(true);
                      setActionError(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Proses Pengembalian</span>
                  </button>
                )}

                {/* Archived items: View certificate */}
                {(loan.status === 'RETURNED' || loan.status === 'APPROVED') && (
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setLetterModalOpen(true);
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Lihat Dokumen SK</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Konfirmasi Serah Terima Sarpras */}
      {dispatchModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispatch-modal-title"
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Tahap Serah Terima
                </span>
                <h3 id="dispatch-modal-title" className="text-lg font-bold text-slate-900">
                  Konfirmasi Serah Terima Unit / Kunci
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold disabled:opacity-50"
              >
                Tutup
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-blue-800 font-bold">Nomor Tiket</span>
                <span className="font-mono font-bold text-blue-950">{selectedLoan.ticket_code}</span>
              </div>
              <div className="border-t border-blue-100 pt-2">
                <p className="font-bold text-slate-900">{selectedLoan.asset_name} ({selectedLoan.asset_code})</p>
                <p className="text-slate-600 mt-1">Lokasi: {selectedLoan.asset_location}</p>
              </div>
              <p className="text-slate-600">
                Pemohon: <span className="font-semibold text-slate-800">{selectedLoan.borrower_name}</span> ({selectedLoan.borrower_role})
              </p>
              <p className="text-slate-600">
                Jadwal: <span className="font-semibold text-slate-800">{selectedLoan.start_date} ({selectedLoan.start_time}) s/d {selectedLoan.end_date} ({selectedLoan.end_time})</span>
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              Pastikan unit atau kunci sudah diserahkan kepada pemohon. Setelah dikonfirmasi, status peminjaman berubah menjadi <strong>sedang digunakan</strong>.
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                disabled={submitting}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDispatchConfirm}
                disabled={submitting}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Serah Terima'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Checklist Verifikasi Staff Sarpras */}
      {staffModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Verifikasi Tahap 1 (Staff Sarpras)
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Checklist Kelaikan Sarpras
                </h3>
              </div>
              <button
                onClick={() => setStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Tutup
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Loan info summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-800">{selectedLoan.asset_name} ({selectedLoan.asset_code})</p>
              <p className="text-slate-600">Pemohon: {selectedLoan.borrower_name} ({selectedLoan.borrower_role})</p>
              <p className="text-slate-600">Waktu: {selectedLoan.start_date} s/d {selectedLoan.end_date}</p>
              <p className="text-slate-600">Agenda: {selectedLoan.purpose}</p>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Daftar Checklist Pemeriksaan:
              </span>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={staffCheck.unit_available}
                  onChange={(e) => setStaffCheck({ ...staffCheck, unit_available: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Unit sarpras berstatus siap jalan/pakai dan tidak bentrok jadwal kegiatan universitas.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={staffCheck.physical_condition_ok}
                  onChange={(e) => setStaffCheck({ ...staffCheck, physical_condition_ok: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Kondisi fisik sarpras telah diperiksa dan dalam keadaan baik (bersih, AC/mesin normal).
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={staffCheck.fuel_or_key_ready}
                  onChange={(e) => setStaffCheck({ ...staffCheck, fuel_or_key_ready: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Kesiapan armada/ruang (BBM terisi / supir kampus siap / kunci ruangan siap di pool).
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={staffCheck.documents_complete}
                  onChange={(e) => setStaffCheck({ ...staffCheck, documents_complete: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Kelengkapan identitas pemohon dan relevansi keperluan kegiatan kampus valid.
                </span>
              </label>
            </div>

            {/* Notes input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Catatan Verifikasi Staff</label>
              <textarea
                rows={2}
                placeholder="Tulis catatan atau rekomendasi untuk Kepala Sarpras..."
                value={staffCheck.notes}
                onChange={(e) => setStaffCheck({ ...staffCheck, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStaffSubmit('FORWARD')}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Loloskan & Teruskan ke Kepala Sarpras</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStaffSubmit('REJECT')}
                className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Pengajuan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Persetujuan Kepala Bagian Sarpras */}
      {headModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Persetujuan Akhir (Kepala Sarpras)
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Keputusan Izin Peminjaman
                </h3>
              </div>
              <button
                onClick={() => setHeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Tutup
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Staff Review Result Summary */}
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-blue-900 font-bold">
                <span>Hasil Verifikasi Staff Sarpras:</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded">TERVERIFIKASI</span>
              </div>
              <p className="text-blue-800">
                Staff PIC: <b className="text-blue-950">{selectedLoan.staff_verified_by || 'Staff Sarpras'}</b>
              </p>
              <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-blue-100 mt-1">
                &ldquo;{selectedLoan.staff_notes || 'Checklist fisik dan jadwal aman.'}&rdquo;
              </p>
            </div>

            {/* Head Checklist */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Pertimbangan Kepala Sarpras:
              </span>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headCheck.priority_approved}
                  onChange={(e) => setHeadCheck({ ...headCheck, priority_approved: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Menyetujui urgensi & skala prioritas kegiatan pemohon untuk universitas.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headCheck.schedule_approved}
                  onChange={(e) => setHeadCheck({ ...headCheck, schedule_approved: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Menyetujui penugasan armada / penguncian jadwal ruang pada tanggal terkait.
                </span>
              </label>
            </div>

            {/* Notes input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Disposisi / Pesan Resmi Kepala Sarpras</label>
              <textarea
                rows={2}
                placeholder="Tuliskan arahan (misal: Disetujui, harap menjaga ketertiban sarpras)..."
                value={headCheck.notes}
                onChange={(e) => setHeadCheck({ ...headCheck, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleHeadSubmit('APPROVE')}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui (Approve) & Terbitkan Izin</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleHeadSubmit('REJECT')}
                className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Checklist Pengembalian Sarpras (Return) */}
      {returnModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Penyelesaian & Check-in
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Pemeriksaan Fisik Pengembalian
                </h3>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Tutup
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Checklist pengembalian */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnCheck.condition_ok}
                  onChange={(e) => setReturnCheck({ ...returnCheck, condition_ok: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Kondisi fisik sarpras kembali lengkap, utuh, dan tidak ada kerusakan atau kehilangan.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnCheck.cleanliness_ok}
                  onChange={(e) => setReturnCheck({ ...returnCheck, cleanliness_ok: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Kebersihan sarpras / armada / ruangan dalam keadaan bersih dan rapi.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnCheck.fuel_ok}
                  onChange={(e) => setReturnCheck({ ...returnCheck, fuel_ok: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Kunci kendaraan/ruangan telah diserahkan kembali ke petugas sarpras.
                </span>
              </label>
            </div>

            {/* Checkbox buat tiket maintenance jika ada isu */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnCheck.create_maintenance_ticket}
                  onChange={(e) => setReturnCheck({ ...returnCheck, create_maintenance_ticket: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-xs font-bold text-amber-900">
                  Ada Kerusakan? Buat Tiket Perawatan (Maintenance) Otomatis
                </span>
              </label>

              {returnCheck.create_maintenance_ticket && (
                <div className="pt-2 space-y-1">
                  <label className="text-[11px] font-bold text-amber-800">Uraian Kerusakan / Kendala:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lampu proyektor redup, ban belakang mobil kempes..."
                    value={returnCheck.maintenance_description}
                    onChange={(e) => setReturnCheck({ ...returnCheck, maintenance_description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Catatan Pengembalian</label>
              <textarea
                rows={2}
                placeholder="Catatan kondisi akhir unit..."
                value={returnCheck.notes}
                onChange={(e) => setReturnCheck({ ...returnCheck, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleReturnSubmit}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan & Catat Pengembalian</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {selectedLoan && (
        <OfficialLetterModal
          loan={selectedLoan}
          isOpen={letterModalOpen}
          onClose={() => {
            setLetterModalOpen(false);
            setSelectedLoan(null);
          }}
        />
      )}
    </div>
  );
}

export default function PeminjamanPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat meja peminjaman...</div>}>
      <PeminjamanContent />
    </Suspense>
  );
}

