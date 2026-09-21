import {
    AlertTriangle,
    Car,
    CheckCircle,
    CheckCircle2,
    Clock,
    HelpCircle,
    RotateCcw,
    Wrench,
    XCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status?: string;
  value?: string;
  type?: 'loan' | 'asset' | 'condition' | 'maintenance';
}

export function StatusBadge({ status, value, type = 'loan' }: StatusBadgeProps) {
  const resolvedStatus = (value ?? status) ?? '';
  const s = resolvedStatus;

  if (type === 'loan') {
    switch (s) {
      case 'PENDING_STAFF':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Menunggu Verifikasi Staff
          </span>
        );
      case 'PENDING_HEAD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Menunggu Persetujuan Kepala
          </span>
        );
      case 'PENDING_ADMIN_UMUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Menunggu Kepala Administrasi Umum
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui (Siap Pakai)
          </span>
        );
      case 'IN_USE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Car className="w-3.5 h-3.5" />
            Sedang Digunakan
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <RotateCcw className="w-3.5 h-3.5" />
            Selesai / Dikembalikan
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <HelpCircle className="w-3 h-3" />
            {status}
          </span>
        );
    }
  }

  if (type === 'asset') {
    switch (s) {
      case 'TERSEDIA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tersedia
          </span>
        );
      case 'DIPINJAM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Sedang Dipinjam
          </span>
        );
      case 'DALAM_PERAWATAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Dalam Perawatan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  }

  if (type === 'condition') {
    switch (s) {
      case 'BAIK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Kondisi Baik
          </span>
        );
      case 'RUSAK_RINGAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Rusak Ringan
          </span>
        );
      case 'RUSAK_BERAT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Rusak Berat
          </span>
        );
      default:
        return <span className="text-xs text-gray-600">{status}</span>;
    }
  }

  if (type === 'maintenance') {
    switch (s) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Dijadwalkan
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3.5 h-3.5 animate-spin" />
            Sedang Dikerjakan
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai
          </span>
        );
      default:
        return <span className="text-xs text-gray-600">{status}</span>;
    }
  }

  return <span className="text-xs">{status}</span>;
}

