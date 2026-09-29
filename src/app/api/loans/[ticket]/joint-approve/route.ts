import { getCurrentUser } from '@/lib/auth';
import { APPROVER_ROLE_LABEL, APPROVAL_STAGES, ApprovalStage, canSignApprovals } from '@/lib/loanApproval';
import {
  ApprovalError,
  applyStageDecision,
  ensurePendingApproval,
  findLoanByTicket,
  signStagesTogether,
} from '@/lib/loanApprovalServer';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ ticket: string }>;
}

const VALID_STAGES = new Set<string>(APPROVAL_STAGES);

/**
 * Persetujuan bersama dalam satu aksi.
 *
 * Semua checklist (staff, kepala bagian, dan kepala administrasi) dapat dicentang
 * sekaligus lalu dikirim bersama, sehingga tidak perlu membuka tiap tahap satu per satu.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!canSignApprovals(user?.role)) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak. Persetujuan bersama hanya untuk Staff Sarpras, Kepala Bagian Sarpras, Kepala Administrasi Umum, atau Admin.',
        },
        { status: 403 }
      );
    }

    const { ticket } = await params;
    const body = await req.json().catch(() => ({}));
    const { action, notes, stages, staff, head, admin_umum } = body;

    const loan = await findLoanByTicket(ticket);
    ensurePendingApproval(loan);

    if (action === 'REJECT') {
      const result = await applyStageDecision(
        loan,
        {
          action: 'REJECT',
          notes,
          atField: 'admin_umum_approved_at',
          byField: 'admin_umum_approved_by',
          notesField: 'admin_umum_notes',
          checklistField: 'admin_umum_checklist',
        },
        user!.name
      );

      return NextResponse.json({
        success: true,
        message: `Seluruh persetujuan ditolak oleh ${APPROVER_ROLE_LABEL[user!.role] || user!.role}.`,
        loan: result.loan,
      });
    }

    const requested: ApprovalStage[] = Array.isArray(stages) && stages.length > 0
      ? stages.filter((stage: string): stage is ApprovalStage => VALID_STAGES.has(stage))
      : [...APPROVAL_STAGES];

    if (requested.length === 0) {
      return NextResponse.json({ error: 'Tidak ada tahap persetujuan yang dipilih' }, { status: 400 });
    }

    const result = await signStagesTogether(
      loan,
      requested,
      {
        staff: {
          notes: staff?.notes ?? notes,
          checklist: {
            unit_available: staff?.unit_available !== false,
            physical_condition_ok: staff?.physical_condition_ok !== false,
            fuel_or_key_ready: staff?.fuel_or_key_ready !== false,
            documents_complete: staff?.documents_complete !== false,
            notes: staff?.notes ?? notes ?? '',
          },
        },
        head: {
          notes: head?.notes ?? notes,
          checklist: {
            priority_approved: head?.priority_approved !== false,
            schedule_approved: head?.schedule_approved !== false,
            notes: head?.notes ?? notes ?? '',
          },
        },
        admin_umum: {
          notes: admin_umum?.notes ?? notes,
          checklist: {
            administration_approved: admin_umum?.administration_approved !== false,
            notes: admin_umum?.notes ?? notes ?? '',
          },
        },
      },
      user!.name
    );

    return NextResponse.json({
      success: true,
      message: result.isFullyApproved
        ? 'Persetujuan bersama lengkap untuk Staff, Kepala Bagian, dan Kepala Administrasi Umum. Peminjaman siap untuk serah terima.'
        : `Persetujuan dicatat atas nama ${APPROVER_ROLE_LABEL[user!.role] || user!.role}. Menunggu ${APPROVAL_STAGES.length - result.signedCount} persetujuan lagi.`,
      loan: result.loan,
    });
  } catch (err: unknown) {
    if (err instanceof ApprovalError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Joint approve error:', err);
    return NextResponse.json({ error: 'Gagal memproses persetujuan bersama' }, { status: 500 });
  }
}
