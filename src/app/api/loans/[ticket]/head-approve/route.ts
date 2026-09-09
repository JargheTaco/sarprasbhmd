import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'KEPALA_SARPRAS' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Kepala Bagian Sarpras atau Admin yang berwenang memberikan persetujuan akhir.' },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { action, notes, priority_approved, schedule_approved } = body;

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

    if (loan.status !== 'PENDING_HEAD') {
      return NextResponse.json(
        { error: `Pengajuan tidak dalam tahap persetujuan Kepala Sarpras (Status saat ini: ${loan.status})` },
        { status: 400 }
      );
    }

    const checklistJson = JSON.stringify({
      priority_approved: !!priority_approved,
      schedule_approved: !!schedule_approved,
      notes: notes || '',
    });

    const now = new Date().toISOString();
    const newStatus = action === 'REJECT' ? 'REJECTED' : 'APPROVED';

    db.prepare(`
      UPDATE loan_requests
      SET 
        status = ?,
        head_notes = ?,
        head_checklist = ?,
        head_approved_at = ?,
        head_approved_by = ?
      WHERE id = ?
    `).run(
      newStatus,
      notes || (action === 'REJECT' ? 'Ditolak oleh Kepala Sarpras' : 'Disetujui oleh Kepala Sarpras'),
      checklistJson,
      now,
      user.name,
      loan.id
    );

    const updated = db.prepare('SELECT * FROM loan_requests WHERE id = ?').get(loan.id);

    return NextResponse.json({
      success: true,
      message: action === 'REJECT' 
        ? 'Pengajuan peminjaman telah ditolak oleh Kepala Sarpras' 
        : 'Peminjaman disetujui resmi oleh Kepala Sarpras! Pemohon dapat mencetak Surat Izin Peminjaman.',
      loan: updated,
    });
  } catch (err: unknown) {
    console.error('Head approve error:', err);
    return NextResponse.json({ error: 'Gagal memproses persetujuan Kepala Sarpras' }, { status: 500 });
  }
}

