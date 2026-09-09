'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Tv, 
  Zap, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Edit3, 
  Layers, 
  DollarSign,
  User,
  CheckCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface MaintenanceRecord {
  id: string;
  ticket_number: string;
  asset_id: string;
  asset_name: string;
  asset_code: string;
  asset_location: string;
  asset_condition: string;
  type: string; // PREVENTIVE / CORRECTIVE
  category: string; // ELECTRONIC / MACHINERY / ELECTRICAL
  title: string;
  description?: string;
  technician_name: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  status: string; // SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED
  action_taken?: string;
  spare_parts?: string;
  created_at: string;
}

interface AssetOption {
  id: string;
  code: string;
  name: string;
  category: string;
  condition: string;
}

export default function PerawatanPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PREVENTIVE' | 'CORRECTIVE' | 'COMPLETED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    asset_id: '',
    type: 'PREVENTIVE',
    category: 'ELECTRONIC',
    title: '',
    description: '',
    technician_name: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost: 0,
  });

  const [updateForm, setUpdateForm] = useState({
    status: 'IN_PROGRESS',
    technician_name: '',
    scheduled_date: '',
    cost: 0,
    action_taken: '',
    spare_parts: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/maintenance?';
      if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
      if (search.trim()) url += `q=${encodeURIComponent(search.trim())}&`;

      const [mntRes, assetsRes] = await Promise.all([
        fetch(url),
        fetch('/api/assets'),
      ]);

      const mntData = await mntRes.json();
      const assetsData = await assetsRes.json();

      if (mntData?.records) setRecords(mntData.records);
      if (assetsData?.assets) {
        // Filter assets relevant to maintenance (ELECTRONIC, MACHINERY, ELECTRICAL, or all)
        const relevantAssets = assetsData.assets.filter((a: AssetOption) =>
          ['ELECTRONIC', 'MACHINERY', 'ELECTRICAL'].includes(a.category)
        );
        setAssets(relevantAssets.length > 0 ? relevantAssets : assetsData.assets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, search]);

  const filteredRecords = records.filter((r) => {
    if (activeTab === 'PREVENTIVE') return r.type === 'PREVENTIVE' && r.status !== 'COMPLETED';
    if (activeTab === 'CORRECTIVE') return r.type === 'CORRECTIVE' && r.status !== 'COMPLETED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  const handleOpenCreate = () => {
    setCreateForm({
      asset_id: assets[0]?.id || '',
      type: 'PREVENTIVE',
      category: assets[0]?.category || 'ELECTRONIC',
      title: '',
      description: '',
      technician_name: 'Teknisi Sarpras Internal',
      scheduled_date: new Date().toISOString().split('T')[0],
      cost: 0,
    });
    setErrorMsg(null);
    setCreateModalOpen(true);
  };

  const handleOpenUpdate = (rec: MaintenanceRecord) => {
    setSelectedRecord(rec);
    setUpdateForm({
      status: rec.status,
      technician_name: rec.technician_name || '',
      scheduled_date: rec.scheduled_date,
      cost: rec.cost || 0,
      action_taken: rec.action_taken || '',
      spare_parts: rec.spare_parts || '',
    });
    setErrorMsg(null);
    setUpdateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat tiket perawatan');

      setCreateModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/maintenance/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui perawatan');

      setUpdateModalOpen(false);
      setSelectedRecord(null);
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-amber-600 font-bold text-xs uppercase tracking-wider">
            Jobdesc 2: Pemeliharaan Sarpras
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Perawatan Alat Pembelajaran Elektronik, Mesin & Kelistrikan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal servis preventif proyektor, smartboard, mesin bengkel CNC, dan uji genset/panel listrik kampus.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Jadwalkan Perawatan Baru</span>
        </button>
      </div>

      {/* 3 Jobdesc Pillar Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">Alat Elektronik Pembelajaran</span>
            <p className="text-[11px] text-slate-500">Proyektor laser, interactive board, sound system</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">Mesin Workshop & Lab</span>
            <p className="text-[11px] text-slate-500">Mesin bubut, CNC benchtop, kompresor lab</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block">Kelistrikan & Genset Kampus</span>
            <p className="text-[11px] text-slate-500">Genset 50 kVA Cummins, panel LVMDP, trafo</p>
          </div>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Semua Tiket', val: 'ALL' },
            { label: 'Servis Preventif (Rutin)', val: 'PREVENTIVE' },
            { label: 'Perbaikan Kerusakan', val: 'CORRECTIVE' },
            { label: 'Riwayat Selesai', val: 'COMPLETED' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setActiveTab(tab.val as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.val
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="ELECTRONIC">Elektronik</option>
            <option value="MACHINERY">Mesin</option>
            <option value="ELECTRICAL">Kelistrikan</option>
          </select>

          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tiket/alat..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Record Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">Memuat log pemeliharaan aset...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Tidak ada catatan perawatan pada filter ini.</p>
          <p className="text-xs text-slate-400">Seluruh alat elektronik dan mesin beroperasi normal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {rec.ticket_number}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      rec.type === 'PREVENTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rec.type === 'PREVENTIVE' ? 'RUTIN' : 'PERBAIKAN'}
                    </span>
                  </div>
                  <StatusBadge status={rec.status} type="maintenance" />
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">
                  {rec.title}
                </h3>

                <p className="text-xs text-slate-600 font-semibold mb-2">
                  Aset: <span className="text-blue-900">{rec.asset_name}</span> ({rec.asset_code})
                </p>

                {rec.description && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed mb-3">
                    {rec.description}
                  </p>
                )}

                {rec.action_taken && (
                  <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 mb-2">
                    <span className="font-bold block text-[11px]">Tindakan:</span>
                    <p>{rec.action_taken}</p>
                    {rec.spare_parts && (
                      <p className="text-[11px] text-emerald-800 mt-1 font-mono">Suku Cadang: {rec.spare_parts}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Jadwal: {rec.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Teknisi: {rec.technician_name}</span>
                  </div>
                  {rec.cost > 0 && (
                    <div className="text-emerald-700 font-bold text-[11px]">
                      Biaya: {formatRupiah(rec.cost)}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenUpdate(rec)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Progres</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Form Pemeliharaan Baru
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Jadwalkan Perawatan Sarpras
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
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

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Aset (Elektronik / Mesin / Listrik) *</label>
                <select
                  required
                  value={createForm.asset_id}
                  onChange={(e) => {
                    const sel = assets.find((a) => a.id === e.target.value);
                    setCreateForm({
                      ...createForm,
                      asset_id: e.target.value,
                      category: sel ? sel.category : 'ELECTRONIC',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name} - ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tipe Perawatan</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="PREVENTIVE">Preventif (Rutin Berkala)</option>
                    <option value="CORRECTIVE">Korektif (Perbaikan Rusak)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    required
                    value={createForm.scheduled_date}
                    onChange={(e) => setCreateForm({ ...createForm, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Judul Kegiatan Perawatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penggantian Oli & Pengecekan Filter Genset 50 kVA"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Deskripsi / Gejala Masalah</label>
                <textarea
                  rows={2}
                  placeholder="Rincian kendala atau target komponen yang diservis..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Teknisi / Vendor PIC</label>
                  <input
                    type="text"
                    placeholder="Nama teknisi / PT..."
                    value={createForm.technician_name}
                    onChange={(e) => setCreateForm({ ...createForm, technician_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={createForm.cost}
                    onChange={(e) => setCreateForm({ ...createForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal Perawatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PROGRES MODAL */}
      {updateModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Update Log Pengerjaan
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedRecord.ticket_number} - {selectedRecord.asset_name}
                </h3>
              </div>
              <button
                onClick={() => setUpdateModalOpen(false)}
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

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Pengerjaan *</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="SCHEDULED">Dijadwalkan (SCHEDULED)</option>
                  <option value="IN_PROGRESS">Sedang Dikerjakan (IN_PROGRESS)</option>
                  <option value="COMPLETED">Selesai Normal (COMPLETED)</option>
                  <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
                </select>
                {updateForm.status === 'COMPLETED' && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    * Memilih status Selesai otomatis memulihkan aset menjadi Tersedia & Kondisi Baik.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Teknisi Penanggung Jawab</label>
                  <input
                    type="text"
                    value={updateForm.technician_name}
                    onChange={(e) => setUpdateForm({ ...updateForm, technician_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Realisasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={updateForm.cost}
                    onChange={(e) => setUpdateForm({ ...updateForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tindakan Perbaikan / Servis yang Dilakukan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pembersihan filter udara, penggantian aki 24V, kalibrasi putaran spindle..."
                  value={updateForm.action_taken}
                  onChange={(e) => setUpdateForm({ ...updateForm, action_taken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Suku Cadang / Spare Parts Diganti</label>
                <input
                  type="text"
                  placeholder="Contoh: V-Belt SPZ 950, Oli Shell Tellus 68, Fuse 10A..."
                  value={updateForm.spare_parts}
                  onChange={(e) => setUpdateForm({ ...updateForm, spare_parts: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : 'Perbarui Log Pengerjaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

