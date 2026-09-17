'use client';

import { StatusBadge } from '@/components/StatusBadge';
import {
  AlertCircle,
  Edit3,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
  created_at: string;
}

interface CurrentUser {
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';
}

export default function InventarisPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'VEHICLE',
    building: '',
    room: '',
    location: '',
    condition: 'BAIK',
    status: 'TERSEDIA',
    specs: '',
    capacity: 0,
    purchase_year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
    // Fetch after filter changes; the request updates loading and asset state asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets();
  }, [selectedCategory, selectedStatus, search]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF_SARPRAS';
  const assetsByLocation = assets.reduce<Record<string, Asset[]>>((groups, asset) => {
    const building = asset.building || 'Gedung belum diisi';
    const room = asset.room || asset.location || 'Ruang belum diisi';
    const key = `${building}|||${room}`;
    groups[key] ??= [];
    groups[key].push(asset);
    return groups;
  }, {});

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormData({
      code: '',
      name: '',
      category: 'VEHICLE',
      building: '',
      room: '',
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
      building: asset.building || '',
      room: asset.room || '',
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
      const res = await fetch('/api/assets/import', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor inventaris');
      const duplicateInfo = data.skipped > 0 ? ` ${data.skipped} data dilewati karena nomor inventaris sudah ada.` : '';
      setImportMessage(`${data.imported} data inventaris berhasil diimpor.${duplicateInfo}`);
      await fetchAssets();
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal mengimpor inventaris');
    } finally {
      setImporting(false);
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
          {canEdit && (
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
          )}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak / Ekspor</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aset Baru</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
        <p className="font-bold">Impor data dari Google Sheets</p>
        <p className="mt-1">Di Google Sheets pilih File → Download → Comma-separated values (.csv), lalu unggah melalui tombol Impor CSV. Kolom yang dibaca: No. Inventaris, Jenis Barang, Tanggal Perolehan, Harga Pembelian, Nilai Penyusutan, Nilai Buku, dan Keberadaan.</p>
        {importMessage && <p className="mt-2 font-semibold text-emerald-700">{importMessage}</p>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-blue-950">Ringkasan isi ruangan / lokasi</h2>
            <p className="text-xs text-blue-800 mt-0.5">
              Gunakan satu lokasi untuk satu kelas atau ruangan, lalu catat setiap jenis barang sebagai aset.
            </p>
          </div>
          {!canEdit && currentUser && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-white border border-blue-200 rounded-lg px-2 py-1 whitespace-nowrap">
              Mode lihat saja
            </span>
          )}
        </div>
        {Object.keys(assetsByLocation).length === 0 ? (
          <p className="text-xs text-blue-700">Belum ada data lokasi yang sesuai filter.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(assetsByLocation).map(([locationKey, locationAssets]) => {
              const [building, room] = locationKey.split('|||');
              return (
              <div key={locationKey} className="bg-white border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span>{building} / {room}</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 rounded-md px-1.5 py-0.5">
                    {locationAssets.length} jenis
                  </span>
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                  {locationAssets.map((asset) => (
                    <li key={asset.id} className="flex justify-between gap-2">
                      <span className="truncate">{asset.name}</span>
                      <span className="font-bold text-slate-800 whitespace-nowrap">
                        {asset.capacity > 0
                          ? asset.category === 'ROOM'
                            ? `${asset.capacity} orang`
                            : `${asset.capacity} unit`
                          : '1 unit'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              );
            })}
          </div>
        )}
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
                <th className="px-4 py-3">Gedung / Ruang</th>
                <th className="px-4 py-3">Kondisi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kapasitas</th>
                {canEdit && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-slate-400">
                    Memuat data master inventaris...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-slate-400">
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
                      <div>{asset.building || 'Belum ditentukan'}</div>
                      <div className="text-[11px]">{asset.room || asset.location || 'Belum ditentukan'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.condition} type="condition" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.status} type="asset" />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {asset.capacity > 0
                        ? asset.category === 'ROOM'
                          ? `${asset.capacity} Org`
                          : `${asset.capacity} Unit`
                        : '-'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(asset)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Aset"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(asset)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Aset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 font-mono placeholder:text-slate-400 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                <label className="font-bold text-slate-700">Gedung *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung B"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
                />
              </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ruang / Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: E2.9"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kondisi Fisik</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
                  >
                    <option value="TERSEDIA">Tersedia</option>
                    <option value="DIPINJAM">Sedang Dipinjam</option>
                    <option value="DALAM_PERAWATAN">Dalam Perawatan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Unit / Kapasitas</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
                  />
                  <p className="text-[10px] text-slate-500">Contoh: Proyektor 2, Kursi 30, Layar 1.</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tahun Pengadaan</label>
                  <input
                    type="number"
                    value={formData.purchase_year}
                    onChange={(e) => setFormData({ ...formData, purchase_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-slate-700"
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

