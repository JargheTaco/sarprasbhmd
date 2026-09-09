'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Building2, 
  Car, 
  Tv, 
  Wrench, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

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
  created_at: string;
}

export default function InventarisPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'VEHICLE',
    location: '',
    condition: 'BAIK',
    status: 'TERSEDIA',
    specs: '',
    capacity: 0,
    purchase_year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let url = '/api/assets?';
      if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;
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
    fetchAssets();
  }, [selectedCategory, selectedStatus, search]);

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormData({
      code: '',
      name: '',
      category: 'VEHICLE',
      location: '',
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: '',
      capacity: 0,
      purchase_year: new Date().getFullYear(),
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      code: asset.code,
      name: asset.name,
      category: asset.category,
      location: asset.location,
      condition: asset.condition,
      status: asset.status,
      specs: asset.specs || '',
      capacity: asset.capacity || 0,
      purchase_year: asset.purchase_year || new Date().getFullYear(),
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
    if (!confirm(`Hapus master aset ${asset.name} (${asset.code})?`)) return;

    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus aset');
      await fetchAssets();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus aset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
            Jobdesc 1: Inventarisasi Aset
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Arsip & Master Data Aset Kampus
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan mobil dinas, ruang kelas, proyektor laser, mesin bengkel, serta unit kelistrikan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak / Ekspor</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aset Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="VEHICLE">Mobil Kampus</option>
            <option value="ROOM">Ruang Kelas & Aula</option>
            <option value="ELECTRONIC">Alat Pembelajaran Elektronik</option>
            <option value="MACHINERY">Mesin Workshop / Lab</option>
            <option value="ELECTRICAL">Kelistrikan & Genset</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="TERSEDIA">Tersedia</option>
            <option value="DIPINJAM">Sedang Dipinjam</option>
            <option value="DALAM_PERAWATAN">Dalam Perawatan</option>
          </select>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, atau lokasi..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Sarpras</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Kondisi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kapasitas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Memuat data master inventaris...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada aset ditemukan.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {asset.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{asset.name}</div>
                      <span className="text-[11px] font-normal text-slate-500 line-clamp-1">
                        {asset.specs || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {asset.category}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {asset.location}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.condition} type="condition" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.status} type="asset" />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {asset.capacity > 0 ? `${asset.capacity} Org` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(asset)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Aset"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Aset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAsset ? 'Perbarui Data Aset' : 'Tambah Aset Sarpras Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Tutup
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kode Sarpras *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingAsset}
                    placeholder="Contoh: MOB-004"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="VEHICLE">Mobil Kampus</option>
                    <option value="ROOM">Ruang Kelas & Aula</option>
                    <option value="ELECTRONIC">Alat Pembelajaran Elektronik</option>
                    <option value="MACHINERY">Mesin Bengkel / Lab</option>
                    <option value="ELECTRICAL">Kelistrikan & Genset</option>
                    <option value="GENERAL">Inventaris Umum</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Sarpras / Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toyota Avanza Dinas / Proyektor Epson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Lokasi / Pool / Gedung *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pool Garasi Rektorat / Gedung B Lt. 2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kondisi Fisik</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BAIK">Kondisi Baik</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                    <option value="RUSAK_BERAT">Rusak Berat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Ketersediaan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TERSEDIA">Tersedia</option>
                    <option value="DIPINJAM">Sedang Dipinjam</option>
                    <option value="DALAM_PERAWATAN">Dalam Perawatan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kapasitas (Orang / Unit)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tahun Pengadaan</label>
                  <input
                    type="number"
                    value={formData.purchase_year}
                    onChange={(e) => setFormData({ ...formData, purchase_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Spesifikasi Lengkap / Rincian</label>
                <textarea
                  rows={2}
                  placeholder="Nomor plat, daya listrik, tipe transmisi, kelengkapan..."
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

