'use client';

import {
  BookOpen,
  Building2,
  ClipboardList,
  DoorOpen,
  Printer,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  asset_type: string;
  building: string;
  room: string;
  location: string;
  condition: string;
  status: string;
  specs: string;
  capacity: number;
  purchase_year: number;
  purchase_date: string | null;
  purchase_price: number;
  depreciation_rate: number;
  depreciation_current: number;
  depreciation_previous: number;
  book_value: number;
  funding_source: string;
}

const ROOM_AREA: Record<string, string> = {
  'D1.1 / R.MULTIMEDIA': '80 m²',
  'D1.2 / PRODI S1 KEPERAWATAN': '80 m²',
  'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)': '80 m²',
  'D1.4 / PRODI DIII KEPERAWATAN': '80 m²',
  'D1.5 / KELAS PERKULIAHAN': '80 m²',
  'D2.1 / KELAS PERKULIAHAN': '80 m²',
  'D2.2 / KELAS PERKULIAHAN': '80 m²',
  'D2.3 / KELAS PERKULIAHAN': '80 m²',
  'D2.4 / RUANG PERKULIAHAN': '80 m²',
  'D2.5 / RUANG PERKULIAHAN': '80 m²',
  'Ruang D1.1 / R.MULTIMEDIA': '80 m²',
};

function conditionLabel(c: string) {
  if (c === 'BAIK') return 'Baik';
  if (c === 'RUSAK_RINGAN') return 'Rusak Ringan';
  if (c === 'RUSAK_BERAT') return 'Rusak Berat';
  return c;
}

export default function InventarisPublikPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [kirMode, setKirMode] = useState(false);

  useEffect(() => {
    fetch('/api/assets?asset_type=INVENTARIS')
      .then(res => res.json())
      .then(data => setAssets(data?.assets || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  const buildings = useMemo(
    () => Array.from(new Set(assets.map(a => a.building).filter(Boolean))).sort(),
    [assets]
  );

  const rooms = useMemo(() => {
    if (selectedBuilding === 'ALL') return [];
    return Array.from(
      new Set(assets.filter(a => a.building === selectedBuilding).map(a => a.room).filter(Boolean))
    ).sort();
  }, [assets, selectedBuilding]);

  const filtered = useMemo(() => {
    return assets.filter(a => {
      if (selectedBuilding !== 'ALL' && a.building !== selectedBuilding) return false;
      if (selectedRoom !== 'ALL' && a.room !== selectedRoom) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.name?.toLowerCase().includes(q) ||
          a.code?.toLowerCase().includes(q) ||
          a.room?.toLowerCase().includes(q) ||
          a.specs?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, selectedBuilding, selectedRoom, search]);

  // Group filtered assets by building → room for the card view
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Asset[]>> = {};
    for (const a of filtered) {
      const bld = a.building || 'Belum Ditentukan';
      const rm = a.room || a.location || 'Belum Ditentukan';
      if (!map[bld]) map[bld] = {};
      if (!map[bld][rm]) map[bld][rm] = [];
      map[bld][rm].push(a);
    }
    return map;
  }, [filtered]);

  // KIR-specific room title
  const kirRoomAssets = selectedRoom !== 'ALL' && selectedBuilding !== 'ALL'
    ? filtered.filter(a => a.building === selectedBuilding && a.room === selectedRoom)
    : [];

  const firstAssetInRoom = kirRoomAssets[0];
  const specsAreaMatch = firstAssetInRoom?.specs?.match(/Luas:\s*([^;]+)/i);
  const kirArea = (selectedRoom !== 'ALL' && ROOM_AREA[selectedRoom])
    ? ROOM_AREA[selectedRoom]
    : (specsAreaMatch ? specsAreaMatch[1].trim() : ((selectedRoom !== 'ALL' && selectedRoom.includes('Ruang')) ? '80 m²' : '—'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <header className="border-b border-slate-200 pb-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
              Portal Informasi Publik
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              Inventaris Ruangan & Kelas
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Kartu Inventaris Ruangan (KIR) Universitas Bhamada Slawi — informasi aset tetap di setiap gedung, ruangan, laboratorium, dan unit kampus.
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            <strong>Mencari sarpras untuk dipinjam?</strong>{' '}
            <Link href="/katalog" className="underline font-semibold text-blue-700">Buka Katalog Peminjaman Sarpras →</Link>
            {' '}untuk mengajukan peminjaman mobil kampus, aula, atau alat portabel.
          </span>
        </div>
      </header>

      {/* Filter controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama barang, kode, spesifikasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={selectedBuilding}
            onChange={e => {
              setSelectedBuilding(e.target.value);
              setSelectedRoom('ALL');
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="ALL">— Pilih Gedung —</option>
            {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          {selectedBuilding !== 'ALL' && rooms.length > 0 && (
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">— Semua Ruangan —</option>
              {rooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          {selectedBuilding !== 'ALL' && selectedRoom !== 'ALL' && (
            <button
              onClick={() => setKirMode(!kirMode)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-colors ${
                kirMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              {kirMode ? 'Mode KIR Aktif' : 'Tampilkan KIR'}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Menampilkan <strong>{filtered.length.toLocaleString('id-ID')}</strong> item inventaris
          {selectedBuilding !== 'ALL' ? ` di ${selectedBuilding}` : ' di seluruh kampus'}
          {selectedRoom !== 'ALL' ? ` — ${selectedRoom}` : ''}.
        </p>
      </div>

      {/* KIR PRINT VIEW */}
      {kirMode && selectedBuilding !== 'ALL' && selectedRoom !== 'ALL' && kirRoomAssets.length > 0 && (
        <div className="bg-white border-2 border-slate-300 rounded-3xl overflow-hidden shadow-lg print:shadow-none print:border print:rounded-none print:max-w-full">
          {/* KIR Header / Kop */}
          <div className="border-b-[3px] border-slate-900 px-8 py-4 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 bg-emerald-50 flex items-center justify-center text-[10px] font-black text-slate-800">
                  UB
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-[0.25em]">Universitas Bhamada Slawi</p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">KARTU INVENTARIS RUANGAN</h2>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                <p>Gedung : {selectedBuilding}</p>
                <p>Ruang : {selectedRoom}</p>
                <p>Luas Ruang : {kirArea}</p>
              </div>
            </div>
          </div>

          {/* KIR Table */}
          <div className="px-8 py-4 overflow-x-auto">
            <table className="w-full text-[11px] border border-slate-300">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border border-slate-700 px-2 py-2 text-center font-bold">No</th>
                  <th className="border border-slate-700 px-2 py-2 text-center font-bold">Kode Inventaris</th>
                  <th className="border border-slate-700 px-2 py-2 text-left font-bold">Nama Barang</th>
                  <th className="border border-slate-700 px-2 py-2 text-center font-bold">Jumlah</th>
                  <th className="border border-slate-700 px-2 py-2 text-left font-bold">Spesifikasi</th>
                  <th className="border border-slate-700 px-2 py-2 text-center font-bold">Tahun Perolehan</th>
                  <th className="border border-slate-700 px-2 py-2 text-center font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {kirRoomAssets.map((asset, idx) => (
                  <tr key={asset.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-2 py-2 text-center align-top">{idx + 1}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-mono align-top">{asset.code}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top font-medium">{asset.name}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center align-top font-bold">{asset.capacity || 1}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top text-slate-600" title={asset.specs}>{asset.specs || '-'}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center align-top">{asset.purchase_year || '-'}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center align-top font-semibold text-emerald-700">{conditionLabel(asset.condition)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KIR Signatures */}
          <div className="px-8 py-6 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 max-w-2xl ml-auto text-xs text-center">
              <div>
                <p className="font-semibold text-slate-600 mb-16">Ka. BAU</p>
                <div className="border-b border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-900">Sidiq Pranoto, SE</p>
                <p className="text-slate-500 text-[10px] mt-0.5">NIPY : 1973.10.03.00.016</p>
              </div>
              <div>
                <p className="font-semibold text-slate-600 mb-16">Kasubag Sarpras</p>
                <div className="border-b border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-900">Umi Salamah</p>
                <p className="text-slate-500 text-[10px] mt-0.5">NIPY : 1969.12.07.96.004</p>
              </div>
            </div>
          </div>

          {/* Print button */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu Inventaris Ruangan (KIR)
            </button>
          </div>
        </div>
      )}

      {/* NORMAL VIEW - grouped by building/room */}
      {!kirMode && (
        loading ? (
          <div className="text-center py-16 text-slate-400">Memuat data inventaris...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data inventaris ditemukan.</p>
            {search && <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci pencarian.</p>}
            {selectedBuilding === 'ALL' && !search && (
              <p className="text-slate-400 text-sm mt-1">Pilih gedung di atas untuk melihat inventaris ruangan.</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).sort().map(([building, rooms]) => (
              <div key={building}>
                {/* Building header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{building}</h2>
                    <p className="text-xs text-slate-500">
                      {Object.keys(rooms).length} ruangan •{' '}
                      {Object.values(rooms).reduce((s, r) => s + r.length, 0)} item inventaris
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(rooms).sort().map(([room, roomAssets]) => (
                    <div key={room} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                      {/* Room header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100 flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{room}</p>
                          <p className="text-[10px] text-slate-500">{roomAssets.length} barang inventaris</p>
                        </div>
                        {ROOM_AREA[room] && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                            {ROOM_AREA[room]}
                          </span>
                        )}
                      </div>

                      {/* Item list */}
                      <ul className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                        {roomAssets.map((asset, idx) => (
                          <li key={asset.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">{asset.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{asset.code}</p>
                              {asset.purchase_year && (
                                <p className="text-[10px] text-slate-400">
                                  {asset.purchase_year} • {asset.funding_source || 'YPTSH'} • Jml: {asset.capacity || 1}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                asset.condition === 'BAIK'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : asset.condition === 'RUSAK_RINGAN'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {conditionLabel(asset.condition)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* KIR link */}
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                        <button
                          onClick={() => {
                            setSelectedBuilding(building);
                            setSelectedRoom(room);
                            setKirMode(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <ClipboardList className="w-3 h-3" />
                          Lihat Kartu Inventaris Ruangan (KIR)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}