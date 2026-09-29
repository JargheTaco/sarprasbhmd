import {
  APPROVAL_STAGES,
  APPROVAL_STAGE_META,
  ApprovalStage,
  countApprovals,
  isPendingApproval,
} from '@/lib/loanApproval';
import { supabaseAdmin } from '@/lib/supabase';

export interface LoanApprovalRow {
  id: string;
  status: string;
  ticket_code: string;
  [key: string]: unknown;
}

export interface StageDecisionInput {
  action: 'APPROVE' | 'REJECT';
  notes?: string;
  checklist?: Record<string, unknown>;
  /** Nama field tanggal penandatanganan tahap ini, mis. `staff_verified_at`. */
  atField: string;
  byField: string;
  notesField: string;
  checklistField: string;
}

export class ApprovalError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApprovalError';
  }
}

export async function findLoanByTicket(ticket: string): Promise<LoanApprovalRow> {
  const { data, error } = await supabaseAdmin
    .from('loan_requests')
    .select('*')
    .or(`ticket_code.eq.${ticket},id.eq.${ticket}`)
    .limit(1);
  if (error) throw error;

  const loan = data?.[0] as LoanApprovalRow | undefined;
  if (!loan) {
    throw new ApprovalError('Pengajuan peminjaman tidak ditemukan', 404);
  }
  return loan;
}

export function ensurePendingApproval(loan: LoanApprovalRow) {
  if (!isPendingApproval(loan.status)) {
    throw new ApprovalError(
      `Pengajuan tidak sedang menunggu persetujuan (Status saat ini: ${loan.status})`,
      400,
    );
  }
}

/** Menghitung ulang apakah seluruh pihak sudah menandatangani pengajuan. */
function isAllSigned(loan: Record<string, unknown>) {
  return APPROVAL_STAGES.every((stage) => Boolean(loan[APPROVAL_STAGE_META[stage].atField]));
}

/** Menyetapkan status menjadi APPROVED ketika tiga tanda tangan sudah lengkap. */
async function finalizeWhenComplete(loanId: string) {
  const { data, error } = await supabaseAdmin
    .from('loan_requests')
    .update({ status: 'APPROVED' })
    .eq('id', loanId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Menyimpan satu tanda tangan persetujuan.
 *
 * Penolakan langsung menutup pengajuan sebagai REJECTED. Persetujuan hanya menaikkan
 * status menjadi APPROVED bila Staff, Kepala Bagian, dan Kepala Administrasi Umum
 * semuanya sudah menandatangani, tanpa harus menunggu secara berurutan.
 */
export async function applyStageDecision(
  loan: LoanApprovalRow,
  decision: StageDecisionInput,
  actorName: string,
) {
  const now = new Date().toISOString();
  const isRejected = decision.action === 'REJECT';

  const patch: Record<string, unknown> = {
    [decision.atField]: now,
    [decision.byField]: actorName,
    [decision.notesField]: decision.notes?.trim() || defaultNoteFromField(decision.notesField, isRejected),
  };
  if (decision.checklist) {
    patch[decision.checklistField] = decision.checklist;
  }
  if (isRejected) {
    patch.status = 'REJECTED';
  }

  const { error: updateError } = await supabaseAdmin
    .from('loan_requests')
    .update(patch)
    .eq('id', loan.id);
  if (updateError) throw updateError;

  const { data: updated, error: fetchError } = await supabaseAdmin
    .from('loan_requests')
    .select('*')
    .eq('id', loan.id)
    .single();
  if (fetchError) throw fetchError;

  if (!isRejected && isAllSigned(updated)) {
    const finalized = await finalizeWhenComplete(loan.id);
    return { loan: finalized, isFullyApproved: true, signedCount: APPROVAL_STAGES.length };
  }

  return { loan: updated, isFullyApproved: false, signedCount: countApprovals(updated) };
}

function defaultNoteFromField(notesField: string, isRejected: boolean) {
  const stage = APPROVAL_STAGES.find((item) => APPROVAL_STAGE_META[item].notesField === notesField);
  const label = stage ? APPROVAL_STAGE_META[stage].label : 'persetujuan peminjaman';
  return isRejected ? `Ditolak pada ${label}` : `Disetujui pada ${label}`;
}
