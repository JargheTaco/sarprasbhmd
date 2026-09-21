import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [{ data: assets, error: assetsError }, { data: loans, error: loansError }, { data: maintenance, error: maintenanceError }] = await Promise.all([
      supabaseAdmin.from('assets').select('*'),
      supabaseAdmin.from('loan_requests').select('*, assets(name, category)').order('created_at', { ascending: false }),
      supabaseAdmin.from('maintenance_records').select('*, assets(name, code)').order('created_at', { ascending: false }),
    ]);
    if (assetsError || loansError || maintenanceError) {
      throw assetsError || loansError || maintenanceError;
    }

    const count = (rows: { status?: string; category?: string }[], predicate: (row: { status?: string; category?: string }) => boolean) => rows.filter(predicate).length;
    const totalAssets = assets.length;
    const vehicleCount = count(assets, (row) => row.category === 'VEHICLE');
    const roomCount = count(assets, (row) => row.category === 'ROOM');
    const maintenanceAssetsCount = count(assets, (row) => ['ELECTRONIC', 'MACHINERY', 'ELECTRICAL'].includes(row.category || ''));
    const availableAssets = count(assets, (row) => row.status === 'TERSEDIA');
    const pendingStaff = count(loans, (row) => row.status === 'PENDING_STAFF');
    const pendingHead = count(loans, (row) => row.status === 'PENDING_HEAD');
    const pendingAdminUmum = count(loans, (row) => row.status === 'PENDING_ADMIN_UMUM');
    const approvedLoans = count(loans, (row) => row.status === 'APPROVED');
    const inUseLoans = count(loans, (row) => row.status === 'IN_USE');
    const returnedLoans = count(loans, (row) => row.status === 'RETURNED');
    const scheduledMnt = count(maintenance, (row) => row.status === 'SCHEDULED');
    const inProgressMnt = count(maintenance, (row) => row.status === 'IN_PROGRESS');
    const completedMnt = count(maintenance, (row) => row.status === 'COMPLETED');
    const recentLoans = loans.slice(0, 5).map((loan) => ({ ...loan, asset_name: loan.assets?.name, asset_category: loan.assets?.category, assets: undefined }));
    const recentMaintenances = maintenance.slice(0, 5).map((record) => ({ ...record, asset_name: record.assets?.name, asset_code: record.assets?.code, assets: undefined }));

    return NextResponse.json({
      success: true,
      stats: {
        assets: {
          total: totalAssets,
          vehicles: vehicleCount,
          rooms: roomCount,
          maintenance_category: maintenanceAssetsCount,
          available: availableAssets,
        },
        loans: {
          pending_staff: pendingStaff,
          pending_head: pendingHead,
          pending_admin_umum: pendingAdminUmum,
          approved: approvedLoans,
          in_use: inUseLoans,
          returned: returnedLoans,
          total_active: pendingStaff + pendingHead + pendingAdminUmum + approvedLoans + inUseLoans,
        },
        maintenance: {
          scheduled: scheduledMnt,
          in_progress: inProgressMnt,
          completed: completedMnt,
          active: scheduledMnt + inProgressMnt,
        },
        recentLoans,
        recentMaintenances,
      },
    });
  } catch (err: unknown) {
    console.error('Fetch stats error:', err);
    return NextResponse.json({ error: 'Gagal mengambil statistik sistem' }, { status: 500 });
  }
}

