'use client';

import { CheckCircle2, Printer, ShieldCheck, X } from 'lucide-react';
import Image from 'next/image';

interface LoanData {
  ticket_code: string;
  borrower_name: string;
  borrower_id: string;
  borrower_role: string;
  borrower_phone: string;
  borrower_email?: string;
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
  status?: string;
  staff_verified_at?: string;
  staff_verified_by?: string;
  head_approved_at?: string;
  head_approved_by?: string;
  admin_umum_approved_at?: string;
  admin_umum_approved_by?: string;
  picked_up_at?: string;
  returned_at?: string;
  handover_to_name?: string;
  handover_to_nip?: string;
  handover_condition?: string;
  staff_notes?: string;
  head_notes?: string;
}

interface Props {
  loan: LoanData;
  isOpen: boolean;
  onClose: () => void;
}

export function OfficialLetterModal({ loan, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Format Indonesian date
  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split(' ')[0].split('-');
      if (parts.length === 3) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Tanggal & jam lengkap dari kolom timestamptz, selalu ditampilkan dalam zona waktu WIB
  const formatDateTimeIndo = (dateTimeStr?: string) => {
    if (!dateTimeStr) return '-';
    const parsed = new Date(dateTimeStr);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      })
        .format(parsed)
        .replace(/\./g, ':');
    }
    const [datePart, timePart] = dateTimeStr.split(/[ T]/);
    const time = timePart ? timePart.slice(0, 5) : '';
    return time ? `${formatDateIndo(datePart)} pukul ${time}` : formatDateIndo(datePart);
  };

  const STATUS_LABEL: Record<string, string> = {
    APPROVED: 'Disetujui (Menunggu Serah Terima)',
    IN_USE: 'Sedang Dipinjam',
    RETURNED: 'Selesai / Sudah Dikembalikan',
  };

  const statusLabel = (loan.status && STATUS_LABEL[loan.status]) || 'Disetujui';
  const printedAt = new Date();
  const printedDate = `${printedAt.getDate()} ${
    ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][printedAt.getMonth()]
  } ${printedAt.getFullYear()}`;

  return (
    <div className="print-letter fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container */}
      <div className="print-letter-container relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:rounded-none">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Surat Izin Peminjaman Sarpras Resmi (Digital)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Letter Content (Printable) */}
        <div className="letter-content p-8 sm:p-12 text-slate-800 bg-white font-serif leading-relaxed print:p-3">
          {/* Letterhead */}
          <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center relative">
            <Image
              src="/logo-universitas.png"
              alt="Logo Universitas Bhamada Slawi"
              width={64}
              height={64}
              className="absolute left-1 top-0 h-14 w-14 object-contain print:h-12 print:w-12"
            />
            <h1 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-slate-900 font-sans mt-0.5">
              UNIVERSITAS BHAMADA SLAWI
            </h1>
            <h2 className="font-bold text-sm uppercase tracking-wide text-blue-900 font-sans">
              SARANA PRASARANA
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Jl. Cut Nyak Dien No.16, Griya Prajamukti, Kalisapu, Kec. Slawi, Kabupaten Tegal, Jawa Tengah 52416
            </p>
          </div>

          {/* Letter Title */}
          <div className="text-center my-4">
            <h3 className="font-bold text-base sm:text-lg uppercase tracking-wider underline underline-offset-4 decoration-2">
              SURAT KEPUTUSAN IZIN PEMINJAMAN SARANA DAN PRASARANA
            </h3>
            <p className="text-xs font-sans text-slate-600 mt-1">
              Nomor: {loan.ticket_code.replace('SARPRAS-', 'IZIN/')}/SARPRAS/{new Date().getFullYear()}
            </p>
          </div>

          {/* Letter Body */}
          <div className="space-y-2 text-xs sm:text-sm">
            <p>
              Berdasarkan hasil verifikasi administrasi & teknis Staff Sarpras serta persetujuan Kepala Bagian Sarana dan Prasarana dan Kepala Administrasi Umum Kampus, dengan ini menerbitkan izin penggunaan sarana prasarana kepada:
            </p>

            {/* Borrower Details Table */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans my-2 space-y-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">Nama Pemohon</span>
                <span className="col-span-2 font-bold text-slate-900">: {loan.borrower_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">NIM / NIP</span>
                <span className="col-span-2 text-slate-900">: {loan.borrower_id} ({loan.borrower_role})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">No. WhatsApp / HP</span>
                <span className="col-span-2 text-slate-900">: {loan.borrower_phone}</span>
              </div>
            </div>

            <p>Untuk melaksanakan kegiatan dengan ketentuan sarana prasarana sebagai berikut:</p>

            {/* Asset Details Table */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans my-2 space-y-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">Sarpras yang Dipinjam</span>
                <span className="col-span-2 font-bold text-blue-900">: {loan.asset_name} ({loan.asset_code})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">Lokasi Sarpras / Garasi</span>
                <span className="col-span-2 text-slate-900">: {loan.asset_location}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">Waktu Penggunaan</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  : {formatDateIndo(loan.start_date)} ({loan.start_time}) s/d {formatDateIndo(loan.end_date)} ({loan.end_time})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-medium">Keperluan / Agenda</span>
                <span className="col-span-2 text-slate-900">: {loan.purpose}</span>
              </div>
              {loan.destination && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Rute / Tujuan</span>
                  <span className="col-span-2 text-slate-900">: {loan.destination}</span>
                </div>
              )}
              {loan.driver_needed ? (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Status Driver</span>
                  <span className="col-span-2 font-semibold text-emerald-700">: Disediakan Driver Kampus</span>
                </div>
              ) : null}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 italic">
              * Pemohon diwajibkan mematuhi tata tertib sarana prasarana, menjaga ketertiban, kebersihan, dan segera melapor saat sarpras dikembalikan ke pool/bagian sarpras.
            </p>
          </div>

          {/* Verification & Signatures Section */}
          <div className="mt-5 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end font-sans">
            {/* Verifikator Staff */}
            <div className="text-center text-xs space-y-1">
              <p className="text-slate-500 text-[11px]">Telah Diverifikasi Oleh:</p>
              <p className="font-semibold text-slate-800">Staff Bagian Sarpras</p>
              <div className="py-1 flex items-center justify-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED DIGITAL
                </span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2">
                {loan.staff_verified_by || 'Rizky Pratama, S.T.'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {formatDateIndo(loan.staff_verified_at)}
              </p>
            </div>

            {/* Approver Head of Sarpras */}
            <div className="text-center text-xs space-y-1">
              <p className="text-slate-500 text-[11px]">Mengetahui & Menyetujui:</p>
              <p className="font-semibold text-slate-800">Kepala Bagian Sarpras</p>
              <div className="py-1 flex items-center justify-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  OFFICIALLY APPROVED
                </span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2">
                {loan.head_approved_by || 'Dr. Ir. Hendra Wijaya, M.T.'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                NIP. 197408122002121001
              </p>
            </div>

            {/* Approver Head of General Administration */}
            <div className="text-center text-xs space-y-1">
              <p className="text-slate-500 text-[11px]">Menyetujui Administrasi:</p>
              <p className="font-semibold text-slate-800">Kepala Administrasi Umum</p>
              <div className="py-1 flex items-center justify-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ADMINISTRATIVELY APPROVED
                </span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2">
                {loan.admin_umum_approved_by || 'Kepala Administrasi Umum'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {formatDateIndo(loan.admin_umum_approved_at)}
              </p>
            </div>
          </div>

          {/* Bukti Serah Terima / Penerima Ruangan (CS) */}
          <div className="mt-4 border-t border-dashed border-slate-300 pt-3 font-sans">
            <h4 className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-800">
              Bukti Penerimaan Ruangan / Serah Terima
            </h4>
            <p className="text-[10px] text-center text-slate-600 mt-1">
              Bagian ini diisi dan ditandatangani bersama petugas jaga atau CS Ruangan saat ruang/sarpras diterima.
            </p>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
              <div className="flex gap-2">
                <span className="text-slate-500 w-32 shrink-0">Nomor Tiket</span>
                <span className="font-mono text-slate-900 font-bold">{loan.ticket_code}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-32 shrink-0">Status saat dicetak</span>
                <span className="text-slate-900 font-semibold">{statusLabel}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-32 shrink-0">Jadwal Pinjam</span>
                <span className="text-slate-900">
                  {formatDateIndo(loan.start_date)} {loan.start_time} s/d {formatDateIndo(loan.end_date)} {loan.end_time}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-32 shrink-0">Tanggal & jam diterima</span>
                <span className="text-slate-900">
                  {loan.picked_up_at ? formatDateTimeIndo(loan.picked_up_at) : '..........................'}
                </span>
              </div>
              {loan.returned_at && (
                <div className="flex gap-2 sm:col-span-2">
                  <span className="text-slate-500 w-32 shrink-0">Tanggal dikembalikan</span>
                  <span className="text-slate-900">{formatDateTimeIndo(loan.returned_at)}</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-[11px] text-slate-800">
              <p className="text-slate-500">Kondisi saat diterima (coret yang tidak berlaku):</p>
              <p className="mt-0.5 font-semibold">
                {loan.handover_condition ? '☑' : '☐'} Baik &nbsp;&nbsp; {loan.handover_condition === 'RUSAK_RINGAN' ? '☑' : '☐'} Rusak Ringan &nbsp;&nbsp; {loan.handover_condition === 'RUSAK_BERAT' ? '☑' : '☐'} Rusak Berat
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-6 text-[11px]">
              <div className="text-center">
                <p className="font-bold text-slate-800">Penerima (Pemohon)</p>
                <p className="text-slate-500">{loan.borrower_name}</p>
                <div className="h-14" />
                <p className="border-t border-slate-400 pt-1">Tanda Tangan &amp; Nama</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800">Petugas / CS Ruangan</p>
                <p className="text-slate-500">
                  {loan.handover_to_name || '......................................'}
                </p>
                {loan.handover_to_nip && (
                  <p className="text-slate-500">NIP: {loan.handover_to_nip}</p>
                )}
                <div className="h-14" />
                <p className="border-t border-slate-400 pt-1">Tanda Tangan &amp; Nama</p>
              </div>
            </div>

            <p className="mt-2 text-[9.5px] text-slate-500 text-center font-sans">
              Dicetak pada {printedDate} · Dokumen resmi dari sistem SIM-SARPRAS Universitas Bhamada Slawi
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center print:hidden">
          <p className="text-xs text-slate-500">
            Tunjukkan surat ini kepada petugas jaga atau CS Ruangan saat menerima ruang, kunci, atau sarpras.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

