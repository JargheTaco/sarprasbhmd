'use client';

import { StatusBadge } from '@/components/StatusBadge';
import {
    Building2,
    ClipboardList,
    Layers,
    MapPin,
    Search,
    Tv,
    Wrench,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  building: string;
  room: string;
  location: string;
  condition: string;
  status: string;
  specs: string;
  capacity: number;
  purchase_year: number;
}

const categories = [
  { label: 'Semua Inventaris', value: 'ALL', icon: Layers },
  { label: 'Ruang Kelas & Aula', value: 'ROOM', icon: Building2 },
  { label: 'Elektronik Pembelajaran', value: 'ELECTRONIC', icon: Tv },
  { label: 'Mesin & Workshop', value: 'MACHINERY', icon: Wrench },
  { label: 'Kelistrikan', value: 'ELECTRICAL', icon: Zap },
  { label: 'Kendaraan', value: 'VEHICLE', icon: Building2 },
];

export default function InventarisPublikPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');

  const buildings = Array.from('ABCDEFGHIJKL');

  useEffect(() => {
    let url = '/api/assets?';
    if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
    if (search.trim()) url += `q=${encodeURIComponent(search.trim())}&`;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAssets(data?.assets || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const getBuildingKey = (building: string) => {
    const normalized = building.trim().toUpperCase();
    const match = normalized.match(/^(?:GEDUNG\s*)?([A-L])(?:\d|\s|$)/);
    return match?.[1] || 'OTHER';
  };

  const filteredAssets = selectedBuilding === 'ALL'
    ? assets
    : assets.filter((asset) => getBuildingKey(asset.building || asset.location) === selectedBuilding);

  const filteredLocations = filteredAssets.reduce<Record<string, Asset[]>>((groups, asset) => {
    const building = asset.building || 'Gedung belum diisi';
    const room = asset.room || asset.location || 'Ruang belum diisi';
    const key = `${building}|||${room}`;
    groups[key] ??= [];
    groups[key].push(asset);
    return groups;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
              Inventaris Aset Universitas Bhamada
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Lihat fasilitas setiap kelas, ruang, laboratorium, dan unit universitas. Data ini bersifat informasi publik untuk mahasiswa dan dosen.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kelas, proyektor, kursi, layar, mic, atau aset lain..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedBuilding('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              selectedBuilding === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Semua Inventaris
          </button>
          {buildings.map((building) => (
            <button
              type="button"
              key={building}
              onClick={() => setSelectedBuilding(building)}
              className={`min-w-10 px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                selectedBuilding === building
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {building}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const selected = selectedCategory === category.value;
            return (
              <button
                type="button"
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  selected
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500">Memuat inventaris universitas...</div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          Inventaris untuk {selectedBuilding === 'ALL' ? 'pencarian ini' : `Gedung ${selectedBuilding}`} belum tersedia.
        </div>
      ) : (
        <div className="space-y-8">
          {selectedBuilding === 'ALL' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <h2 className="text-lg font-black text-blue-950">Inventaris Keseluruhan Kampus</h2>
              <p className="text-xs text-blue-800 mt-1">Seluruh aset ditampilkan berdasarkan gedung dan ruang masing-masing.</p>
            </div>
          )}
          {selectedBuilding !== 'ALL' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <h2 className="text-lg font-black text-blue-950">Inventaris Gedung {selectedBuilding}</h2>
              <p className="text-xs text-blue-800 mt-1">Pilih gedung lain untuk melihat inventaris ruang yang berbeda.</p>
            </div>
          )}
          {Object.entries(filteredLocations).map(([locationKey, locationAssets]) => {
            const [building, room] = locationKey.split('|||');
            return (
            <section key={locationKey} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h2 className="font-bold text-slate-900">{building}</h2>
                  <p className="text-sm font-semibold text-blue-700">Ruang {room}</p>
                  <p className="text-xs text-slate-500">{locationAssets.length} jenis aset tercatat</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3">No</th>
                      <th className="px-5 py-3">Kode Inventaris</th>
                      <th className="px-5 py-3">Nama Barang</th>
                      <th className="px-5 py-3">Jumlah</th>
                      <th className="px-5 py-3">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {locationAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{locationAssets.indexOf(asset) + 1}</td>
                    <td className="px-5 py-3 font-mono font-bold text-blue-700">{asset.code}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{asset.name}</p>
                      {asset.specs && <p className="text-[11px] text-slate-500 mt-1">{asset.specs}</p>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      {asset.capacity > 0 ? `${asset.capacity} ${asset.category === 'ROOM' ? 'orang' : 'unit'}` : '1 unit'}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={asset.condition} type="condition" /></td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            </section>
            );
          })}
        </div>
      )}
    </div>
  );
}