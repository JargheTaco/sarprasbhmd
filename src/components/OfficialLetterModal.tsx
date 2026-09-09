'use client';

import React from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';

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
  staff_verified_at?: string;
  staff_verified_by?: string;
  head_approved_at?: string;
  head_approved_by?: string;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:rounded-none">
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
        <div className="p-8 sm:p-12 text-slate-800 bg-white font-serif leading-relaxed print:p-8">
          {/* Letterhead */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center">
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-600 font-sans">
              Kementerian Pendidikan Tinggi, Riset, dan Teknologi
            </h4>
            <h1 className="font-extrabold text-lg sm:text-xl uppercase tracking-wider text-slate-900 font-sans mt-0.5">
              UNIVERSITAS KAMPUS MERDEKA
            </h1>
            <h2 className="font-bold text-sm uppercase tracking-wide text-blue-900 font-sans">
              BIRO UMUM DAN PENGELOLAAN SARANA PRASARANA
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Jl. Kampus Terpadu No. 1, Graha Rektorat Lt. 1 | Hotline: (021) 789-0123 | Email: sarpras@kampus.ac.id
            </p>
          </div>

          {/* Letter Title */}
          <div className="text-center my-6">
            <h3 className="font-bold text-base sm:text-lg uppercase tracking-wider underline underline-offset-4 decoration-2">
              SURAT KEPUTUSAN IZIN PEMINJAMAN SARANA DAN PRASARANA
            </h3>
            <p className="text-xs font-sans text-slate-600 mt-1">
              Nomor: {loan.ticket_code.replace('SARPRAS-', 'IZIN/')}/SARPRAS/{new Date().getFullYear()}
            </p>
          </div>

          {/* Letter Body */}
          <div className="space-y-4 text-xs sm:text-sm">
            <p>
              Berdasarkan hasil verifikasi administrasi & teknis Staff Sarpras serta persetujuan Kepala Bagian Sarana dan Prasarana Kampus, dengan ini menerbitkan izin penggunaan sarana prasarana kepada:
            </p>

            {/* Borrower Details Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans my-3 space-y-1.5">
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
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans my-3 space-y-1.5">
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
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4 items-end font-sans">
            {/* QR Verification Seal */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="w-18 h-18 bg-white p-2 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center">
                <QrCode className="w-14 h-14 text-slate-900" />
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Validasi Dokumen Digital</span>
              <span className="text-[10px] font-mono text-blue-700 font-semibold">{loan.ticket_code}</span>
            </div>

            {/* Verifikator Staff */}
            <div className="text-center text-xs space-y-1">
              <p className="text-slate-500 text-[11px]">Telah Diverifikasi Oleh:</p>
              <p className="font-semibold text-slate-800">Staff Bagian Sarpras</p>
              <div className="py-2 flex items-center justify-center">
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
            <div className="text-center text-xs space-y-1 col-span-2 sm:col-span-1">
              <p className="text-slate-500 text-[11px]">Mengetahui & Menyetujui:</p>
              <p className="font-semibold text-slate-800">Kepala Bagian Sarpras</p>
              <div className="py-2 flex items-center justify-center">
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
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center print:hidden">
          <p className="text-xs text-slate-500">
            Tunjukkan surat izin digital atau cetakan ini kepada petugas jaga saat pengambilan unit/kunci.
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

