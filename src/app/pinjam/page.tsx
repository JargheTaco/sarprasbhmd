'use client';

import { StatusBadge } from '@/components/StatusBadge';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

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
}

function PinjamFormContent() {
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAssetId || '');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(preselectedAssetId ? [preselectedAssetId] : []);
  const [roomBuilding, setRoomBuilding] = useState('');
  const [roomName, setRoomName] = useState('');
  
  // Form fields
  const [formData, setFormData] = useState({
    borrower_name: '',
    borrower_id: '',
    borrower_role: 'Mahasiswa',
    borrower_phone: '',
    borrower_email: '',
    start_date: '',
    start_time: '08:00',
    end_date: '',
    end_time: '17:00',
    purpose: '',
    destination: '',
    driver_needed: false,
    attachment_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/assets?loanable=true&status=TERSEDIA')
      .then((res) => res.json())
      .then((data) => {
        if (data?.assets) {
          setAssets(data.assets);
          if (preselectedAssetId && data.assets.some((a: Asset) => a.id === preselectedAssetId)) {
            setSelectedAssetId(preselectedAssetId);
          }
        }
      })
      .catch((err) => console.error('Fetch assets error:', err));
  }, [preselectedAssetId]);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedPortableAssets = assets.filter((asset) => selectedAssetIds.includes(asset.id));
  const portableAssets = assets.filter((asset) => asset.category === 'ELECTRONIC');

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds((current) => {
      const next = current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId];
      setSelectedAssetId(next[0] || '');
      return next;
    });
  };

  // Filter assets by chosen category tab
  const filteredAssets = selectedCategory === 'ALL'
    ? assets
    : assets.filter((a) => a.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedCategory === 'ROOM' && (!roomBuilding || !roomName.trim())) {
      setErrorMsg('Silakan pilih gedung dan isi nama atau nomor ruangan yang ingin dipinjam.');
      return;
    }

    if (selectedCategory !== 'ROOM' && selectedAssetIds.length === 0) {
      setErrorMsg('Silakan pilih minimal satu sarana prasarana yang ingin dipinjam.');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setErrorMsg('Tanggal mulai dan selesai peminjaman wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          asset_id: selectedCategory === 'ROOM' ? null : selectedAssetIds[0],
          asset_ids: selectedAssetIds,
          room_building: selectedCategory === 'ROOM' ? roomBuilding : null,
          room_name: selectedCategory === 'ROOM' ? roomName.trim() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim pengajuan peminjaman');
      }

      setSuccessTicket(data.ticket_code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = () => {
    if (successTicket) {
      navigator.clipboard.writeText(successTicket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title Header */}
      <div className="mb-8">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
          Layanan Publik Tanpa Akun
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          Formulir Pengajuan Peminjaman Sarpras
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Lengkapi data peminjaman di bawah ini. Anda akan menerima Kode Tiket unik untuk melacak proses verifikasi Staff dan persetujuan Kepala Sarpras secara online.
        </p>
      </div>

      {/* Success Modal / State */}
      {successTicket ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Pengajuan Peminjaman Berhasil Dikirim!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Permohonan Anda telah masuk ke sistem dan saat ini sedang menunggu antrean verifikasi oleh Staff Sarpras.
            </p>
          </div>

          {/* Ticket Code Box */}
          <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-6 max-w-md mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Kode Tiket Pelacakan Anda
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-900 tracking-wider">
                {successTicket}
              </span>
              <button
                type="button"
                onClick={handleCopyTicket}
                className="p-2 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                title="Salin Kode Tiket"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-blue-600">
              Simpan kode ini untuk memantau persetujuan atau mencetak surat izin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/tracking?ticket=${successTicket}`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <span>Buka Halaman Pelacakan Live</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessTicket(null);
                setSelectedAssetId('');
                setSelectedAssetIds([]);
                setRoomBuilding('');
                setRoomName('');
                setFormData({
                  borrower_name: '',
                  borrower_id: '',
                  borrower_role: 'Mahasiswa',
                  borrower_phone: '',
                  borrower_email: '',
                  start_date: '',
                  start_time: '08:00',
                  end_date: '',
                  end_time: '17:00',
                  purpose: '',
                  destination: '',
                  driver_needed: false,
                  attachment_url: '',
                });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Ajukan Peminjaman Lain
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pengajuan Gagal Diproses</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Section 1: Pilih Sarana Prasarana */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Pilih Sarana & Prasarana
                </h3>
              </div>
              <span className="text-xs text-rose-500 font-medium">* Wajib dipilih</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Semua Sarpras', val: 'ALL' },
                { label: 'Mobil Kampus', val: 'VEHICLE' },
                { label: 'Ruang Kelas & Aula', val: 'ROOM' },
                { label: 'Peralatan Portabel Sarpras', val: 'ELECTRONIC' },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.val}
                  onClick={() => {
                    setSelectedCategory(tab.val);
                    setSelectedAssetId(tab.val === 'ROOM' ? '' : selectedAssetIds[0] || '');
                    if (tab.val === 'ROOM') setSelectedAssetIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === tab.val
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {selectedCategory === 'ROOM' ? (
              <div className="space-y-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Gedung Kampus *</label>
                  <select
                    required
                    value={roomBuilding}
                    onChange={(e) => setRoomBuilding(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Pilih gedung</option>
                    {Array.from('ABCDEFGHIJKL').map((building) => (
                      <option key={building} value={`Gedung ${building}`}>Gedung {building}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nama / Nomor Ruangan *</label>
                  <input
                    required
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Contoh: E2.9, Lab Komputer, atau Aula"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-blue-800">
                  Pilih gedung A-L lalu tulis ruang yang diperlukan. Ruangan tidak perlu dibuat satu per satu sebagai aset inventaris.
                </p>
                </div>

                <div className="border-t border-blue-200 pt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Peralatan tambahan (opsional)</label>
                    <p className="text-[11px] text-blue-800 mt-1">Centang satu atau beberapa barang yang ingin dipakai di ruang tersebut.</p>
                  </div>
                  {portableAssets.length === 0 ? (
                    <p className="text-xs text-slate-500 bg-white rounded-lg p-3">Belum ada peralatan portabel yang tersedia.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {portableAssets.map((asset) => {
                        const isSelected = selectedAssetIds.includes(asset.id);
                        return (
                          <label
                            key={asset.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected ? 'border-blue-600 bg-white shadow-sm' : 'border-blue-100 bg-white/70 hover:border-blue-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedAssetIds((current) =>
                                isSelected ? current.filter((id) => id !== asset.id) : [...current, asset.id]
                              )}
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-slate-900">{asset.name}</span>
                              <span className="block text-[11px] text-slate-500">{asset.code} · {asset.location}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedCategory === 'ELECTRONIC' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">Pilih satu atau beberapa peralatan yang ingin dipinjam dalam pengajuan ini.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssetIds.includes(asset.id);

                  return (
                    <label
                      key={asset.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAssetSelection(asset.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {asset.code}
                        </span>
                        <StatusBadge status={asset.status} type="asset" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{asset.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">Lokasi: {asset.location}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded">
                        {asset.specs || 'Siap digunakan.'}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssetId === asset.id;

                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setSelectedAssetIds([asset.id]);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {asset.code}
                      </span>
                      <StatusBadge status={asset.status} type="asset" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                      {asset.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                      Lokasi: {asset.location}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded">
                      {asset.specs || 'Siap digunakan.'}
                    </p>
                  </div>
                );
              })}
            </div>
            )}

            {/* Selected Asset Alert */}
            {(selectedAsset || selectedPortableAssets.length > 0) && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  {selectedAsset && <span className="font-bold block">Sarpras Terpilih: {selectedAsset.name}</span>}
                  {selectedPortableAssets.length > 0 && (
                    <span className="font-bold block">Peralatan tambahan: {selectedPortableAssets.map((asset) => asset.name).join(', ')}</span>
                  )}
                  {selectedAsset && <p className="text-blue-700 mt-0.5">Lokasi: {selectedAsset.location} | Kondisi: {selectedAsset.condition} | Kapasitas: {selectedAsset.capacity || '-'} orang</p>}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Waktu Peminjaman */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Jadwal & Waktu Peminjaman
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tanggal Mulai *</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Jam Mulai *</label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tanggal Selesai *</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Jam Selesai *</label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Pemohon */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Identitas Pemohon
                </h3>
              </div>
              <span className="text-xs text-slate-400">Tanpa Perlu Login Akun</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Lengkap Pemohon *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Arya Pratama"
                  value={formData.borrower_name}
                  onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">NIM / NIP / NIDN *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 22051204055"
                  value={formData.borrower_id}
                  onChange={(e) => setFormData({ ...formData, borrower_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Civitas *</label>
                <select
                  value={formData.borrower_role}
                  onChange={(e) => setFormData({ ...formData, borrower_role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Dosen">Dosen / Tenaga Pengajar</option>
                  <option value="Staff/Tendik">Staff / Tenaga Kependidikan</option>
                  <option value="Ormawa/UKM">Organisasi Mahasiswa / UKM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">No. WhatsApp / HP Aktif *</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.borrower_phone}
                  onChange={(e) => setFormData({ ...formData, borrower_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">Notifikasi status verifikasi dapat dicek lewat nomor ini.</p>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Kampus (Opsional)</label>
                <input
                  type="email"
                  placeholder="Contoh: nama@mhs.kampus.ac.id"
                  value={formData.borrower_email}
                  onChange={(e) => setFormData({ ...formData, borrower_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Keperluan & Detail Khusus */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Keperluan & Detail Penggunaan
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tujuan / Keperluan Peminjaman *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan agenda kegiatan secara rinci (contoh: Kunjungan Studi Industri Himpunan ke Bandung, Praktikum Akhir Semester, dsb.)..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Conditional fields if asset is a vehicle */}
              {selectedAsset?.category === 'VEHICLE' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Rute / Kota Tujuan Perjalanan *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta - Bogor (PP)"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formData.driver_needed}
                      onChange={(e) => setFormData({ ...formData, driver_needed: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Memerlukan Driver / Supir Dinas dari Sarpras Kampus
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Link Proposal / Surat Tugas (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={formData.attachment_url}
                  onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">Lampirkan link Google Drive terbuka jika permohonan memerlukan disposisi surat resmi ormawa/fakultas.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Sedang Memproses Pengajuan...</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Kirim Permohonan Peminjaman Sarpras</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              Dengan menekan tombol di atas, Anda menyatakan bersedia mematuhi aturan penggunaan sarana prasarana kampus.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PinjamPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat formulir...</div>}>
      <PinjamFormContent />
    </Suspense>
  );
}

