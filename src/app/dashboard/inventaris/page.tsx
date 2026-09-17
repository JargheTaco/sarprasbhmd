'use client';

import { StatusBadge } from '@/components/StatusBadge';
import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
  purchase_date: string | null;
  purchase_price: number;
  depreciation_rate: number;
  depreciation_previous: number;
  depreciation_current: number;
  book_value: number;
  funding_source: string;
  created_at: string;
}

interface CurrentUser {
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';
}

const CATEGORIES = [
  { value: 'ALL', label: 'Semua Kategori' },
  { value: 'ELECTRONIC', label: 'Elektronik Pembelajaran' },
  { value: 'FURNITURE', label: 'Mebel & Perabot' },
  { value: 'VEHICLE', label: 'Kendaraan' },
  { value: 'ROOM', label: 'Ruang & Aula' },
  { value: 'MACHINERY', label: 'Mesin Bengkel / Lab' },
  { value: 'ELECTRICAL', label: 'Kelistrikan & Genset' },
  { value: 'GENERAL', label: 'Inventaris Umum' },
];

const CATEGORY_LABEL: Record<string, string> = {
  ELECTRONIC: 'Elektronik',
  FURNITURE: 'Mebel',
  VEHICLE: 'Kendaraan',
  ROOM: 'Ruang',
  MACHINERY: 'Mesin',
  ELECTRICAL: 'Kelistrikan',
  GENERAL: 'Umum',
};

const EMPTY_FORM = {
  code: '',
  name: '',
  category: 'ELECTRONIC',
  building: '',
  room: '',
  location: '',
  condition: 'BAIK',
  status: 'TERSEDIA',
  specs: '',
  capacity: 1,
  purchase_year: new Date().getFullYear(),
  purchase_date: '',
  purchase_price: 0,
  depreciation_rate: 10,
  depreciation_previous: 0,
  depreciation_current: 0,
  book_value: 0,
  funding_source: 'YPTSH',
};

function formatRupiah(n: number) {
  if (!n) return '-';
  return 'Rp ' + n.toLocaleString('id-ID');
}

export default function InventarisPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import states
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importBuilding, setImportBuilding] = useState('');
  const [importRoom, setImportRoom] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let url = '/api/assets?';
      if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;
      if (selectedBuilding !== 'ALL') url += `building=${encodeURIComponent(selectedBuilding)}&`;
      if (search.trim()) url += `q=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data?.assets) setAssets(data.assets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets();
  }, [selectedCategory, selectedStatus, selectedBuilding, search]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_SARPRAS';

  // Group assets by building → room
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Asset[]>> = {};
    for (const asset of assets) {
      const bld = asset.building || 'Belum Ditentukan';
      const rm = asset.room || asset.location || 'Belum Ditentukan';
      if (!map[bld]) map[bld] = {};
      if (!map[bld][rm]) map[bld][rm] = [];
      map[bld][rm].push(asset);
    }
    return map;
  }, [assets]);

  const buildings = Object.keys(grouped).sort();

  const toggleBuilding = (b: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  };

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormData({ ...EMPTY_FORM });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      code: asset.code,
      name: asset.name,
      category: asset.category,
      building: asset.building || '',
      room: asset.room || '',
      location: asset.location || '',
      condition: asset.condition,
      status: asset.status,
      specs: asset.specs || '',
      capacity: asset.capacity || 1,
      purchase_year: asset.purchase_year || new Date().getFullYear(),
      purchase_date: asset.purchase_date || '',
      purchase_price: asset.purchase_price || 0,
      depreciation_rate: asset.depreciation_rate || 10,
      depreciation_previous: asset.depreciation_previous || 0,
      depreciation_current: asset.depreciation_current || 0,
      book_value: asset.book_value || 0,
      funding_source: asset.funding_source || 'YPTSH',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan aset');
      setModalOpen(false);
      await fetchAssets();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Hapus aset "${asset.name}" (${asset.code})?\nTindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus aset');
      await fetchAssets();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus aset');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    setErrorMsg(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('building', importBuilding);
      body.append('room', importRoom);
      const res = await fetch('/api/assets/import', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor inventaris');
      const duplicateInfo = data.skipped > 0 ? ` (${data.skipped} data dilewati karena kode sudah ada)` : '';
      setImportMessage(`${data.imported} data berhasil diimpor.${duplicateInfo}`);
      await fetchAssets();
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal mengimpor inventaris');
    } finally {
      setImporting(false);
    }
  };

  const totalAssets = assets.length;
  const totalNilai = assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
            Jobdesc 1 — Inventarisasi Aset
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Arsip & Master Data Inventaris
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan seluruh aset Universitas Bhamada Slawi — mebel, elektronik, kendaraan, mesin, dan kelistrikan.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Mengimpor...' : 'Impor CSV'}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Aset</span>
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak / Ekspor</span>
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Aset', value: totalAssets.toLocaleString('id-ID'), color: 'blue' },
          { label: 'Nilai Perolehan', value: formatRupiah(totalNilai), color: 'emerald' },
          { label: 'Kondisi Baik', value: assets.filter(a => a.condition === 'BAIK').length.toLocaleString('id-ID'), color: 'green' },
          { label: 'Perlu Perhatian', value: assets.filter(a => a.condition !== 'BAIK').length.toLocaleString('id-ID'), color: 'rose' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl px-4 py-3`}>
            <p className={`text-[10px] font-bold text-${s.color}-600 uppercase tracking-wider`}>{s.label}</p>
            <p className={`text-lg font-black text-${s.color}-800 mt-0.5 truncate`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback messages */}
      {importMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2">
          <span>✓</span>
          <span>{importMessage}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Import CSV helper */}
      {canEdit && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Gedung target impor CSV (opsional)"
            value={importBuilding}
            onChange={e => setImportBuilding(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <input
            type="text"
            placeholder="Ruang target impor CSV (opsional)"
            value={importRoom}
            onChange={e => setImportRoom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kode, nama, gedung, ruang..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="ALL">Semua Status</option>
          <option value="TERSEDIA">Tersedia</option>
          <option value="DIPINJAM">Dipinjam</option>
          <option value="DALAM_PERAWATAN">Dalam Perawatan</option>
        </select>
        <select
          value={selectedBuilding}
          onChange={e => setSelectedBuilding(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="ALL">Semua Gedung</option>
          {Array.from(new Set(assets.map(a => a.building).filter(Boolean))).sort().map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Table grouped by gedung & ruang */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Memuat data inventaris...</div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Tidak ada data inventaris ditemukan.</p>
          <p className="text-slate-400 text-xs mt-1">Coba ubah filter atau tambah aset baru.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {buildings.map(building => {
            const isOpen = expandedBuildings.has(building);
            const rooms = Object.keys(grouped[building]).sort();
            const buildingTotal = rooms.reduce((s, r) => s + grouped[building][r].length, 0);
            return (
              <div key={building} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Building header */}
                <button
                  onClick={() => toggleBuilding(building)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-slate-50 hover:from-blue-100 hover:to-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">{building}</p>
                      <p className="text-[10px] text-slate-500">{rooms.length} ruang • {buildingTotal} item</p>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-5 h-5 text-slate-400" />
                    : <ChevronRight className="w-5 h-5 text-slate-400" />
                  }
                </button>

                {isOpen && (
                  <div className="divide-y divide-slate-100">
                    {rooms.map(room => {
                      const roomAssets = grouped[building][room];
                      return (
                        <div key={room}>
                          {/* Room sub-header */}
                          <div className="px-5 py-2 bg-slate-50 flex items-center justify-between">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{room}</p>
                            <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 font-semibold">
                              {roomAssets.length} barang
                            </span>
                          </div>

                          {/* Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                  <th className="px-4 py-2 text-left">No. Inventaris</th>
                                  <th className="px-4 py-2 text-left">Nama Barang</th>
                                  <th className="px-4 py-2 text-center">Kategori</th>
                                  <th className="px-4 py-2 text-center">Jml</th>
                                  <th className="px-4 py-2 text-center">Sumber Dana</th>
                                  <th className="px-4 py-2 text-center">Th. Beli</th>
                                  <th className="px-4 py-2 text-right">Harga Perolehan</th>
                                  <th className="px-4 py-2 text-center">Kondisi</th>
                                  <th className="px-4 py-2 text-center">Status</th>
                                  {canEdit && <th className="px-4 py-2 text-center">Aksi</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {roomAssets.map((asset, idx) => (
                                  <tr key={asset.id} className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-600 whitespace-nowrap">{asset.code}</td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-900">{asset.name}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {CATEGORY_LABEL[asset.category] || asset.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center font-bold text-slate-700">{asset.capacity || 1}</td>
                                    <td className="px-4 py-2.5 text-center text-slate-600">{asset.funding_source || '-'}</td>
                                    <td className="px-4 py-2.5 text-center text-slate-600">{asset.purchase_year || '-'}</td>
                                    <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">{formatRupiah(asset.purchase_price)}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      <StatusBadge type="condition" value={asset.condition} />
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      <StatusBadge type="asset" value={asset.status} />
                                    </td>
                                    {canEdit && (
                                      <td className="px-4 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            onClick={() => handleOpenEdit(asset)}
                                            title="Edit"
                                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDelete(asset)}
                                            title="Hapus"
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAsset ? `Perbarui Data: ${editingAsset.name}` : 'Tambah Aset / Inventaris Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕ Tutup
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: Kode + Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kode / No. Inventaris *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingAsset}
                    placeholder="Contoh: BMD/INV/52/1/1/2008"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ELECTRONIC">Elektronik Pembelajaran</option>
                    <option value="FURNITURE">Mebel & Perabot (Meja, Kursi, Rak)</option>
                    <option value="VEHICLE">Kendaraan Dinas</option>
                    <option value="ROOM">Ruang Kelas & Aula</option>
                    <option value="MACHINERY">Mesin Bengkel / Lab</option>
                    <option value="ELECTRICAL">Kelistrikan & Genset</option>
                    <option value="GENERAL">Inventaris Umum</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Nama Barang */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Barang / Aset *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC Daikin 2 PK / Meja Komputer Multi Partisi"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Row 3: Gedung + Ruang */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Gedung *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gedung D1"
                    value={formData.building}
                    onChange={e => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ruang / Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ruang D1.1 / R.MULTIMEDIA"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Jumlah + Sumber Dana */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Unit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Sumber Dana</label>
                  <select
                    value={formData.funding_source}
                    onChange={e => setFormData({ ...formData, funding_source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YPTSH">YPTSH (Yayasan)</option>
                    <option value="APBD">APBD</option>
                    <option value="APBN">APBN</option>
                    <option value="Hibah">Hibah / Donasi</option>
                    <option value="Mandiri">Dana Mandiri</option>
                    <option value="PNBP">PNBP</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Kondisi + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kondisi Fisik</label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                    <option value="RUSAK_BERAT">Rusak Berat</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Ketersediaan</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TERSEDIA">Tersedia</option>
                    <option value="DIPINJAM">Sedang Dipinjam</option>
                    <option value="DALAM_PERAWATAN">Dalam Perawatan</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Tanggal Perolehan + Tahun */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Perolehan</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={e => setFormData({ ...formData, purchase_date: e.target.value, purchase_year: e.target.value ? parseInt(e.target.value.split('-')[0]) : formData.purchase_year })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tahun Pengadaan</label>
                  <input
                    type="number"
                    min="1990"
                    max="2099"
                    value={formData.purchase_year}
                    onChange={e => setFormData({ ...formData, purchase_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 7: Harga Perolehan + Nilai Buku */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={formData.purchase_price || ''}
                    onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nilai Buku (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={formData.book_value || ''}
                    onChange={e => setFormData({ ...formData, book_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 8: Penyusutan */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Penyusutan (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.depreciation_rate}
                    onChange={e => setFormData({ ...formData, depreciation_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Penyusutan Th. Ini (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.depreciation_current || ''}
                    onChange={e => setFormData({ ...formData, depreciation_current: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Penyusutan Th. Lalu (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.depreciation_previous || ''}
                    onChange={e => setFormData({ ...formData, depreciation_previous: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 9: Spesifikasi */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Spesifikasi / Merk / Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Merk, tipe, nomor seri, kapasitas teknis, catatan perawatan..."
                  value={formData.specs}
                  onChange={e => setFormData({ ...formData, specs: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : editingAsset ? 'Simpan Perubahan' : 'Tambah ke Inventaris'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
