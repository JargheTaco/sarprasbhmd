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
    const { action, notes, unit_available, physical_condition_ok, fuel_or_key_ready, documents_complete } = body;

    const loan = await findLoanByTicket(ticket);
    ensurePendingApproval(loan);

    const checklist = {
      unit_available: !!unit_available,
      physical_condition_ok: !!physical_condition_ok,
      fuel_or_key_ready: !!fuel_or_key_ready,
      documents_complete: !!documents_complete,
      notes: notes || '',
    };

    const result = await applyStageDecision(
      loan,
      {
        action: action === 'REJECT' ? 'REJECT' : 'APPROVE',
        notes,
        checklist,
        atField: 'staff_verified_at',
        byField: 'staff_verified_by',
        notesField: 'staff_notes',
        checklistField: 'staff_checklist',
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
          ? 'Checklist staff lengkap dan seluruh pihak telah menyetujui. Peminjaman siap untuk serah terima.'
          : `Checklist staff dicatat atas nama ${actorLabel}. Menunggu ${APPROVAL_STAGES.length - result.signedCount} persetujuan lagi.`,
      loan: result.loan,
    });
  } catch (err: unknown) {
    if (err instanceof ApprovalError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Staff verify error:', err);
    return NextResponse.json({ error: 'Gagal memproses verifikasi staff' }, { status: 500 });
  }
}

