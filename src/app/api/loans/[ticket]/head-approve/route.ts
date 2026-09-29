import { getCurrentUser } from '@/lib/auth';
import { APPROVER_ROLE_LABEL, APPROVAL_STAGES, canSignApprovals } from '@/lib/loanApproval';
import {
  ApprovalError,
  applyStageDecision,
  ensurePendingApproval,
  findLoanByTicket,
} from '@/lib/loanApprovalServer';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ ticket: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!canSignApprovals(user?.role)) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak. Persetujuan hanya untuk Staff Sarpras, Kepala Bagian Sarpras, Kepala Administrasi Umum, atau Admin.',
        },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json();
    const { action, notes, priority_approved, schedule_approved } = body;

    const loan = await findLoanByTicket(ticket);
    ensurePendingApproval(loan);

    const checklist = {
      priority_approved: !!priority_approved,
      schedule_approved: !!schedule_approved,
      notes: notes || '',
    };

    const result = await applyStageDecision(
      loan,
      {
        action: action === 'REJECT' ? 'REJECT' : 'APPROVE',
        notes,
        checklist,
        atField: 'head_approved_at',
        byField: 'head_approved_by',
        notesField: 'head_notes',
        checklistField: 'head_checklist',
      },
      user!.name
    );

    const actorLabel = APPROVER_ROLE_LABEL[user!.role] || user!.role;
    return NextResponse.json({
      success: true,
      message:
        action === 'REJECT'
          ? `Pengajuan ditolak oleh ${actorLabel}.`
          : result.isFullyApproved
          ? 'Seluruh pihak telah menyetujui. Peminjaman siap untuk serah terima.'
          : `Persetujuan dicatat atas nama ${actorLabel}. Menunggu ${APPROVAL_STAGES.length - result.signedCount} persetujuan lagi.`,
      loan: result.loan,
    });
  } catch (err: unknown) {
    if (err instanceof ApprovalError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Head approve error:', err);
    return NextResponse.json({ error: 'Gagal memproses persetujuan Kepala Bagian Sarpras' }, { status: 500 });
  }
}

