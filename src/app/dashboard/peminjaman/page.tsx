'use client';

import {
  APPROVAL_STAGES,
  APPROVAL_STAGE_META,
  APPROVER_ROLE_LABEL,
  ApprovalStage,
  approvalProgressLabel,
  canSignStage,
  hasStageSigned,
  isOwnStage,
  isPendingApproval,
} from '@/lib/loanApproval';
import { OfficialLetterModal } from '@/components/OfficialLetterModal';
import { StatusBadge } from '@/components/StatusBadge';
import {
  AlertCircle,
  AlertTriangle,
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
  Users,
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
  admin_umum_checklist?: string;
  admin_umum_notes?: string;
  admin_umum_approved_at?: string;
  admin_umum_approved_by?: string;
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
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS' | 'KEPALA_ADMIN_UMUM';
}

const STAGE_BUTTON_CLASS: Record<ApprovalStage, string> = {
  staff: 'bg-amber-600 hover:bg-amber-700 text-white',
  head: 'bg-purple-600 hover:bg-purple-700 text-white',
  admin_umum: 'bg-cyan-600 hover:bg-cyan-700 text-white',
};

const STAGE_BUTTON_LABEL: Record<ApprovalStage, string> = {
  staff: 'Checklist Staff',
  head: 'Persetujuan Kepala',
  admin_umum: 'Persetujuan Administrasi',
};

/**
 * Peringatan bagi Administrator yang menandatangani checklist milik role lain.
 * Pemisahan kewenangan tetap berlaku untuk Staff, Kepala Bagian, dan Kepala
 * Administrasi Umum; hanya Administrator yang boleh acting sebagai cadangan.
 */
function CrossRoleWarning({ stage, userName }: { stage: ApprovalStage; userName: string }) {
  const owner = APPROVER_ROLE_LABEL[APPROVAL_STAGE_META[stage].role];
  return (
    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
      <p className="font-bold flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Perhatian: checklist ini milik {owner}
      </p>
      <p>
        {APPROVAL_STAGE_META[stage].label} seharusnya diisi oleh akun {owner}. Anda sedang
        menandatanganinya atas nama {userName}. Gunakan hanya bila {owner} berhalangan.
      </p>
    </div>
  );
}

function PeminjamanContent() {
  const searchParams = useSearchParams();
  // Tab lama dipetakan ke tab antrean persetujuan agar tautan lama tetap bekerja.
  const rawTab = searchParams.get('tab') || 'approval';
  const initialTab = ['staff', 'head', 'admin-umum'].includes(rawTab) ? 'approval' : rawTab;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [adminUmumModalOpen, setAdminUmumModalOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<ApprovalStage | null>(null);
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

  const [adminUmumCheck, setAdminUmumCheck] = useState({
    administration_approved: true,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    if (activeTab === 'approval') return isPendingApproval(l.status);
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

  const handleAdminUmumSubmit = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/loans/${selectedLoan.ticket_code}/admin-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: adminUmumCheck.notes,
          administration_approved: adminUmumCheck.administration_approved,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses persetujuan Administrasi Umum');

      setAdminUmumModalOpen(false);
      setSelectedLoan(null);
      await fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
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
  const countApproval = loans.filter((l) => isPendingApproval(l.status)).length;
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
            Tiap pihak menyetujui sendiri-sendiri dan tidak saling menunggu: Staff Sarpras, Kepala Bagian Sarpras, dan Kepala Administrasi Umum bisa langsung menandatangani kapan saja.
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
          onClick={() => setActiveTab('approval')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'approval'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Antrean Persetujuan</span>
          {countApproval > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === 'approval' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'}`}>
              {countApproval}
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
          <span>2. Sedang Digunakan</span>
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
          <span>3. Arsip & Riwayat ({countArchive})</span>
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
                {loan.admin_umum_notes && (
                  <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-xs text-cyan-900">
                    <span className="font-bold text-cyan-800">Catatan Administrasi ({loan.admin_umum_approved_by || 'Kepala Administrasi'}):</span> {loan.admin_umum_notes}
                  </div>
                )}

                {/* Progres tiga tanda tangan (tiap pihak menandatangani sendiri) */}
                {isPendingApproval(loan.status) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {APPROVAL_STAGES.map((stage) => {
                      const signed = hasStageSigned(loan, stage);
                      return (
                        <span
                          key={stage}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            signed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          {signed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {APPROVAL_STAGE_META[stage].shortLabel}
                        </span>
                      );
                    })}
                    <span className="text-[10px] font-bold text-slate-500">
                      ({approvalProgressLabel(loan)})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Column */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-48">
                {/* Persetujuan terpisah per role: hanya akun pemilik checklist yang
                    boleh menandatanganinya, dan tidak perlu menunggu pihak lain. */}
                {isPendingApproval(loan.status) && (
                  <div className="flex flex-col gap-1.5">
                    {APPROVAL_STAGES.map((stage) => {
                      const meta = APPROVAL_STAGE_META[stage];
                      const signed = hasStageSigned(loan, stage);
                      const allowed = canSignStage(user?.role, stage);
                      const own = isOwnStage(user?.role, stage);
                      if (!allowed) return null;

                      return (
                        <button
                          key={stage}
                          onClick={() => {
                            setSelectedLoan(loan);
                            setActionError(null);
                            setActiveStage(stage);
                            if (stage === 'staff') setStaffModalOpen(true);
                            if (stage === 'head') setHeadModalOpen(true);
                            if (stage === 'admin_umum') setAdminUmumModalOpen(true);
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            STAGE_BUTTON_CLASS[stage]
                          }`}
                        >
                          {signed ? <CheckCircle2 className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                          <span>
                            {STAGE_BUTTON_LABEL[stage]}
                            {signed ? ' (Ulangi)' : ''}
                          </span>
                        </button>
                      );
                    })}

                    {!APPROVAL_STAGES.some((stage) => canSignStage(user?.role, stage)) && (
                      <p className="text-[10px] text-slate-400 text-center py-2 leading-relaxed">
                        Menunggu checklist {APPROVAL_STAGES.filter((s) => !hasStageSigned(loan, s))
                          .map((s) => APPROVAL_STAGE_META[s].shortLabel)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* In Use: peminjaman aktif langsung setelah disetujui, tanpa serah terima */}
                {loan.status === 'IN_USE' && (
                  <>
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
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setLetterModalOpen(true);
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>Cetak Surat Peminjaman</span>
                    </button>
                  </>
                )}

                {/* Arsip: lihat dokumen */}
                {['RETURNED', 'APPROVED', 'IN_USE'].includes(loan.status) && (
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

      {adminUmumModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
                  Persetujuan Kepala Administrasi Umum
                </span>
                <h3 className="text-lg font-bold text-slate-900">Persetujuan Administrasi Umum</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminUmumModalOpen(false)}
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

            {user && activeStage && !isOwnStage(user.role, activeStage) && (
              <CrossRoleWarning stage={activeStage} userName={user.name} />
            )}

            <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100 text-xs space-y-1.5">
              <p className="font-mono font-bold text-cyan-900">{selectedLoan.ticket_code}</p>
              <p className="font-bold text-slate-900">{selectedLoan.asset_name} ({selectedLoan.asset_code})</p>
              <p className="text-slate-600">Pemohon: {selectedLoan.borrower_name} ({selectedLoan.borrower_role})</p>
              <p className="text-slate-600">Agenda: {selectedLoan.purpose}</p>
              <p className="text-slate-600">
                Tanda tangan terkumpul: {approvalProgressLabel(selectedLoan)}
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={adminUmumCheck.administration_approved}
                onChange={(e) => setAdminUmumCheck({ ...adminUmumCheck, administration_approved: e.target.checked })}
                className="w-4 h-4 text-cyan-600 rounded mt-0.5"
              />
              <span className="text-xs text-slate-800 font-medium">
                Administrasi peminjaman, tujuan kegiatan, dan dokumen pendukung telah diperiksa dan dapat disetujui.
              </span>
            </label>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Catatan Administrasi Umum</label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan atau arahan administrasi..."
                value={adminUmumCheck.notes}
                onChange={(e) => setAdminUmumCheck({ ...adminUmumCheck, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAdminUmumSubmit('APPROVE')}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Setujui & Tanda Tangani
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAdminUmumSubmit('REJECT')}
                className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Tolak
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

