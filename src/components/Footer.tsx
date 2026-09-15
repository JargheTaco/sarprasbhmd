import { Building2, FileCheck, Mail, MapPin, Phone, Shield, Wrench } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                SIM-SARPRAS KAMPUS
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Sistem Informasi Manajemen Terpadu Sarana dan Prasarana Kampus. Mengakomodasi inventarisasi aset, layanan peminjaman publik terpadu (mobil kampus, ruang kelas, peralatan), alur persetujuan bertingkat, serta pemeliharaan alat elektronik, mesin, dan kelistrikan.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                <Shield className="w-3.5 h-3.5" />
                Peminjaman Tanpa Login
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                <FileCheck className="w-3.5 h-3.5" />
                Multi-tier Approval
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                <Wrench className="w-3.5 h-3.5" />
                Perawatan & Pemeliharaan
              </span>
            </div>
          </div>

          {/* Col 2: Layanan Publik */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Layanan Publik
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/pinjam" className="hover:text-blue-400 transition-colors">
                  Formulir Pengajuan Peminjaman
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-blue-400 transition-colors">
                  Lacak Status Kode Tiket
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-blue-400 transition-colors">
                  Katalog Mobil & Ruangan
                </Link>
              </li>
              <li>
                <Link href="/jadwal" className="hover:text-blue-400 transition-colors">
                  Kalender Ketersediaan Sarpras
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Kontak & Unit Sarpras */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Unit Layanan Sarpras
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Gedung E Kampus Selatan Lt. E2.9, Kampus Selatan</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Hotline WA: 0812-3456-7890 (Jam Kerja)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>sarpras@kampus.ac.id</span>
              </li>
              <li className="pt-2">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  Portal Login Staff & Kepala Sarpras &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Bagian Sarana & Prasarana Kampus. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] text-slate-400">Sistem Informasi Inventaris, Peminjaman & Pemeliharaan Sarpras</p>
        </div>
      </div>
    </footer>
  );
}

