'use client';

import { AlertCircle, CheckCircle2, Edit3, Plus, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type UserRole = 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';

interface Account {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  created_at: string;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  STAFF_SARPRAS: 'Staff Sarpras',
  KEPALA_SARPRAS: 'Kepala Sarpras',
};

export default function AkunPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'STAFF_SARPRAS' as UserRole,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data akun');
      setAccounts(data.users || []);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal mengambil data akun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/users')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengambil data akun');
        setAccounts(data.users || []);
      })
      .catch((error: unknown) => setErrorMsg(error instanceof Error ? error.message : 'Gagal mengambil data akun'))
      .finally(() => setLoading(false));
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((me) => {
        if (me?.user?.id) setCurrentUserId(me.user.id);
      });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(editingAccount ? `/api/auth/users/${editingAccount.id}` : '/api/auth/users', {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat akun');

      setFormData({ name: '', username: '', password: '', role: 'STAFF_SARPRAS' });
      setSuccessMsg(`Akun @${data.user.username} berhasil ${editingAccount ? 'diubah' : 'dibuat'}.`);
      setEditingAccount(null);
      await fetchAccounts();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal membuat akun');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({ name: account.name, username: account.username, password: '', role: account.role });
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setFormData({ name: '', username: '', password: '', role: 'STAFF_SARPRAS' });
    setErrorMsg(null);
  };

  const handleDelete = async (account: Account) => {
    if (account.id === currentUserId) return;
    if (!confirm(`Hapus akun ${account.name} (@${account.username})?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/auth/users/${account.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus akun');
      setSuccessMsg(`Akun @${account.username} berhasil dihapus.`);
      await fetchAccounts();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal menghapus akun');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Administrasi Sistem</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Manajemen Akun</h1>
        <p className="text-xs text-slate-500 mt-1">Buat akun petugas baru dan kelola akses pengguna sistem.</p>
      </div>

      {(errorMsg || successMsg) && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${errorMsg ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {errorMsg ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{errorMsg || successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] gap-6 items-start">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><UserPlus className="w-4 h-4" /></div>
            <div><h2 className="font-bold text-slate-900 text-sm">{editingAccount ? 'Edit Akun' : 'Buat Akun Baru'}</h2><p className="text-[11px] text-slate-500">Nama tampilan dapat dibuat sesuai kebutuhan.</p></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Nama lengkap</span><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Budi Santoso" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Username</span><input required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="budi.santoso" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Password {editingAccount && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}</span><input required={!editingAccount} minLength={6} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingAccount ? 'Password baru (opsional)' : 'Minimal 6 karakter'} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">Peran akun</span><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="STAFF_SARPRAS">Staff Sarpras</option><option value="KEPALA_SARPRAS">Kepala Sarpras</option><option value="ADMIN">Administrator</option></select></label>
            <div className="flex gap-2"><button disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"><Plus className="w-4 h-4" />{submitting ? 'Menyimpan...' : editingAccount ? 'Simpan Perubahan' : 'Buat Akun'}</button>{editingAccount && <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer">Batal</button>}</div>
          </form>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /><div><h2 className="font-bold text-slate-900 text-sm">Akun Terdaftar</h2><p className="text-[11px] text-slate-500">{accounts.length} akun dalam sistem</p></div></div>
          {loading ? <div className="p-8 text-center text-xs text-slate-500">Memuat akun...</div> : <div className="divide-y divide-slate-100">{accounts.map((account) => <div key={account.id} className="p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></div><div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{account.name}</p><p className="text-[11px] text-slate-500 font-mono truncate">@{account.username} · {roleLabels[account.role]}</p></div></div><div className="flex items-center gap-1"><button title="Edit akun" onClick={() => handleEdit(account)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"><Edit3 className="w-4 h-4" /></button><button title={account.id === currentUserId ? 'Akun yang sedang digunakan' : 'Hapus akun'} disabled={account.id === currentUserId} onClick={() => handleDelete(account)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>}
        </section>
      </div>
    </div>
  );
}
