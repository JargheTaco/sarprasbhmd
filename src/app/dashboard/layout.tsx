'use client';

import {
    Building2,
    Clock,
    FileCheck2,
    Globe,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Users,
    Wrench,
    X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF_SARPRAS' | 'KEPALA_SARPRAS';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState({ staff: 0, head: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));

    // Fetch pending approvals count
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stats?.loans) {
          setPendingCount({
            staff: data.stats.loans.pending_staff || 0,
            head: data.stats.loans.pending_head || 0,
          });
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold">Memuat data sesi pengguna...</p>
        </div>
      </div>
    );
  }

  const roleLabel = 
    user?.role === 'KEPALA_SARPRAS' ? 'Kepala Bagian Sarpras' :
    user?.role === 'STAFF_SARPRAS' ? 'Staff Sarpras' : 'Administrator';

  const roleColor =
    user?.role === 'KEPALA_SARPRAS' ? 'bg-purple-100 text-purple-800 border-purple-200' :
    user?.role === 'STAFF_SARPRAS' ? 'bg-blue-100 text-blue-800 border-blue-200' :
    'bg-emerald-100 text-emerald-800 border-emerald-200';

  const relevantPending = 
    user?.role === 'KEPALA_SARPRAS' ? pendingCount.head :
    user?.role === 'STAFF_SARPRAS' ? pendingCount.staff :
    pendingCount.staff + pendingCount.head;

  const navItems = [
    {
      name: 'Ringkasan Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Peminjaman & Approval',
      href: '/dashboard/peminjaman',
      icon: FileCheck2,
      badge: relevantPending > 0 ? `${relevantPending} Perlu Tindakan` : null,
    },
    {
      name: 'Inventarisasi Aset',
      href: '/dashboard/inventaris',
      icon: Package,
      badge: null,
    },
    {
      name: 'Perawatan (Maintenance)',
      href: '/dashboard/perawatan',
      icon: Wrench,
      badge: null,
    },
    ...(user?.role === 'ADMIN'
      ? [{
          name: 'Manajemen Akun',
          href: '/dashboard/akun',
          icon: Users,
          badge: null,
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight">SIM-SARPRAS</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">
                SIM-SARPRAS
              </span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                Panel Manajemen
              </span>
            </div>
          </div>

          {/* User profile widget */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">@{user.username}</p>
                </div>
              </div>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-3 mb-2">
              Menu Utama
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Lihat Portal Publik</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Sistem Informasi Sarana Prasarana Kampus
            </h2>
            <p className="text-xs text-slate-500">
              Selamat bertugas, <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/peminjaman"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Verifikasi Masuk: {relevantPending}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

