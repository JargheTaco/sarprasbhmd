import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Assets statistics
    const totalAssets = (db.prepare('SELECT COUNT(*) as c FROM assets').get() as { c: number }).c;
    const vehicleCount = (db.prepare("SELECT COUNT(*) as c FROM assets WHERE category = 'VEHICLE'").get() as { c: number }).c;
    const roomCount = (db.prepare("SELECT COUNT(*) as c FROM assets WHERE category = 'ROOM'").get() as { c: number }).c;
    const maintenanceAssetsCount = (db.prepare("SELECT COUNT(*) as c FROM assets WHERE category IN ('ELECTRONIC', 'MACHINERY', 'ELECTRICAL')").get() as { c: number }).c;
    const availableAssets = (db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'TERSEDIA'").get() as { c: number }).c;

    // Loan statistics
    const pendingStaff = (db.prepare("SELECT COUNT(*) as c FROM loan_requests WHERE status = 'PENDING_STAFF'").get() as { c: number }).c;
    const pendingHead = (db.prepare("SELECT COUNT(*) as c FROM loan_requests WHERE status = 'PENDING_HEAD'").get() as { c: number }).c;
    const approvedLoans = (db.prepare("SELECT COUNT(*) as c FROM loan_requests WHERE status = 'APPROVED'").get() as { c: number }).c;
    const inUseLoans = (db.prepare("SELECT COUNT(*) as c FROM loan_requests WHERE status = 'IN_USE'").get() as { c: number }).c;
    const returnedLoans = (db.prepare("SELECT COUNT(*) as c FROM loan_requests WHERE status = 'RETURNED'").get() as { c: number }).c;

    // Maintenance statistics
    const scheduledMnt = (db.prepare("SELECT COUNT(*) as c FROM maintenance_records WHERE status = 'SCHEDULED'").get() as { c: number }).c;
    const inProgressMnt = (db.prepare("SELECT COUNT(*) as c FROM maintenance_records WHERE status = 'IN_PROGRESS'").get() as { c: number }).c;
    const completedMnt = (db.prepare("SELECT COUNT(*) as c FROM maintenance_records WHERE status = 'COMPLETED'").get() as { c: number }).c;

    // Recent activities
    const recentLoans = db.prepare(`
      SELECT 
        l.id, l.ticket_code, l.borrower_name, l.borrower_role, l.start_date, l.end_date, l.status, l.created_at,
        a.name as asset_name, a.category as asset_category
      FROM loan_requests l
      JOIN assets a ON l.asset_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `).all();

    const recentMaintenances = db.prepare(`
      SELECT 
        m.id, m.ticket_number, m.title, m.category, m.status, m.scheduled_date, m.technician_name,
        a.name as asset_name, a.code as asset_code
      FROM maintenance_records m
      JOIN assets a ON m.asset_id = a.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `).all();

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
          approved: approvedLoans,
          in_use: inUseLoans,
          returned: returnedLoans,
          total_active: pendingStaff + pendingHead + approvedLoans + inUseLoans,
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

