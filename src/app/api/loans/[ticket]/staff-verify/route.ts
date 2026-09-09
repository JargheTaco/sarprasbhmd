import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Staff Sarpras atau Admin yang berwenang melakukan verifikasi ini.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { action, notes, unit_available, physical_condition_ok, fuel_or_key_ready, documents_complete } = body;

    interface LoanRow {
      id: string;
      status: string;
      ticket_code: string;
    }

    const loan = db.prepare(`
      SELECT id, status, ticket_code FROM loan_requests WHERE ticket_code = ? OR id = ?
    `).get(ticket, ticket) as LoanRow | undefined;

    if (!loan) {
      return NextResponse.json({ error: 'Pengajuan peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status !== 'PENDING_STAFF') {
      return NextResponse.json(
        { error: `Pengajuan tidak dalam tahap verifikasi staff (Status saat ini: ${loan.status})` },
        { status: 400 }
      );
    }

    const checklistJson = JSON.stringify({
      unit_available: !!unit_available,
      physical_condition_ok: !!physical_condition_ok,
      fuel_or_key_ready: !!fuel_or_key_ready,
      documents_complete: !!documents_complete,
      notes: notes || '',
    });

    const now = new Date().toISOString();
    const newStatus = action === 'REJECT' ? 'REJECTED' : 'PENDING_HEAD';

    db.prepare(`
      UPDATE loan_requests
      SET 
        status = ?,
        staff_notes = ?,
        staff_checklist = ?,
        staff_verified_at = ?,
        staff_verified_by = ?
      WHERE id = ?
    `).run(
      newStatus,
      notes || (action === 'REJECT' ? 'Ditolak pada tahap verifikasi staff' : 'Terverifikasi oleh staff Sarpras'),
      checklistJson,
      now,
      user.name,
      loan.id
    );

    const updated = db.prepare('SELECT * FROM loan_requests WHERE id = ?').get(loan.id);

    return NextResponse.json({
      success: true,
      message: action === 'REJECT' 
        ? 'Pengajuan telah ditolak oleh staff Sarpras' 
        : 'Verifikasi staff berhasil! Pengajuan diteruskan ke Kepala Sarpras untuk persetujuan akhir.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Staff verify error:', err);
    return NextResponse.json({ error: 'Gagal memproses verifikasi staff' }, { status: 500 });
  }
}

