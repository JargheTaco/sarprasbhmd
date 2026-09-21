'use client';

import { StatusBadge } from '@/components/StatusBadge';
import {
    Building2,
    Car,
    ClipboardList,
    Layers,
    MapPin,
    Search,
    Send,
    Tv,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  purchase_year: number;
}

export default function KatalogPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    let url = '/api/assets?loanable=true&';
    if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
    if (search.trim()) url += `q=${encodeURIComponent(search.trim())}&`;

    // Refresh the public catalog whenever its filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.assets) {
          setAssets(data.assets);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const categories = [
    { label: 'Semua Sarpras', val: 'ALL', icon: Layers },
    { label: 'Mobil Kampus', val: 'VEHICLE', icon: Car },
    { label: 'Ruang Kelas & Aula', val: 'ROOM', icon: Building2 },
    { label: 'Alat Elektronik Pembelajaran', val: 'ELECTRONIC', icon: Tv },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
            Layanan Peminjaman Sarpras
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Katalog Sarpras yang Dapat Dipinjam
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ajukan peminjaman mobil kampus, ruang kelas, aula, proyektor, dan peralatan portabel Sarpras — <strong>tanpa perlu login</strong>.
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

      {/* Banner: link ke inventaris kelas */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
        <ClipboardList className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
        <span>
          <strong>Inventaris aset ruangan dikelola terpisah dari katalog peminjaman.</strong>{' '}
          <Link href="/inventaris" className="underline font-semibold text-blue-700">
            Buka Portal Inventaris Kelas & Ruangan (KIR) →
          </Link>{' '}
          untuk melihat seluruh aset tetap seperti meja, kursi, AC, dan peralatan yang terpasang di setiap ruang kuliah.
        </span>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama aset, kode, lokasi, atau spesifikasi..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.val;
            return (
              <button
                type="button"
                key={cat.val}
                onClick={() => setSelectedCategory(cat.val)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">Memuat data katalog...</div>
      ) : assets.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
          Tidak ditemukan sarana prasarana yang cocok dengan filter pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {asset.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={asset.condition} type="condition" />
                    <StatusBadge status={asset.status} type="asset" />
                  </div>
                </div>

                <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug">
                  {asset.name}
                </h3>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{asset.location}</span>
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed mb-4">
                  <span className="font-bold text-slate-700 block mb-0.5">Spesifikasi & Kapasitas:</span>
                  <p>{asset.specs || 'Tersedia untuk operasional akademik.'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  {asset.capacity > 0 && (
                    <>
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asset.capacity} Orang</span>
                    </>
                  )}
                  {asset.purchase_year && (
                    <span className="text-[11px] text-slate-400 ml-1">
                      (Pengadaan {asset.purchase_year})
                    </span>
                  )}
                </div>

                {asset.status === 'TERSEDIA' ? (
                  <Link
                    href={`/pinjam?asset_id=${asset.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Pinjam Unit</span>
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400 italic">Tidak Tersedia</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

