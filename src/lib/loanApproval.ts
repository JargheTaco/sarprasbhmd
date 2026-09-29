/**
 * Alur persetujuan peminjaman: tiap pihak menyetujui SESUNGGUHNYA sendiri-sendiri,
 * tanpa harus menunggu pihak lain.
 *
 * Pengajuan berhenti di satu status `PENDING_APPROVAL` sampai Staff Sarpras,
 * Kepala Bagian Sarpras, dan Kepala Administrasi Umum masing-masing menandatanganinya.
 * Seorang Kepala Bagian tidak perlu menunggu checklist Staff selesai, dan sebaliknya:
 * urutan siapa menandatangani lebih dulu tidak berpengaruh.
 * Pengajuan menjadi `APPROVED` otomatis setelah tiga tanda tangan lengkap,
 * dan `REJECTED` begitu ada satu pihak menolak.
 *
 * File ini murni logika sehingga aman dipakai di server maupun client component.
 */

export type ApprovalStage = 'staff' | 'head' | 'admin_umum';

export const APPROVAL_STAGES: readonly ApprovalStage[] = ['staff', 'head', 'admin_umum'];

export const TOTAL_APPROVAL_STAGES = APPROVAL_STAGES.length;

export type ApprovalRole = 'STAFF_SARPRAS' | 'KEPALA_SARPRAS' | 'KEPALA_ADMIN_UMUM';

export interface ApprovalStageMeta {
  /** NamaUzuh untuk judul modal dan label antrean. */
  label: string;
  /** Nama pendek untuk chip tanda tangan. */
  shortLabel: string;
  role: ApprovalRole;
  /** Nama endpoint yang menangani tahap ini. */
  endpoint: string;
  atField: string;
  byField: string;
  notesField: string;
  checklistField: string;
}

export const APPROVAL_STAGE_META: Record<ApprovalStage, ApprovalStageMeta> = {
  staff: {
    label: 'Verifikasi Staff Sarpras',
    shortLabel: 'Staff Sarpras',
    role: 'STAFF_SARPRAS',
    endpoint: 'staff-verify',
    atField: 'staff_verified_at',
    byField: 'staff_verified_by',
    notesField: 'staff_notes',
    checklistField: 'staff_checklist',
  },
  head: {
    label: 'Persetujuan Kepala Bagian Sarpras',
    shortLabel: 'Kepala Bagian Sarpras',
    role: 'KEPALA_SARPRAS',
    endpoint: 'head-approve',
    atField: 'head_approved_at',
    byField: 'head_approved_by',
    notesField: 'head_notes',
    checklistField: 'head_checklist',
  },
  admin_umum: {
    label: 'Persetujuan Kepala Administrasi Umum',
    shortLabel: 'Kepala Administrasi Umum',
    role: 'KEPALA_ADMIN_UMUM',
    endpoint: 'admin-approve',
    atField: 'admin_umum_approved_at',
    byField: 'admin_umum_approved_by',
    notesField: 'admin_umum_notes',
    checklistField: 'admin_umum_checklist',
  },
};

/** Status tunggal tempat semua pengajuan menunggu tiga tanda tangan. */
export const APPROVAL_STATUS = 'PENDING_APPROVAL';

/** Status lama masih mungkin tersimpan pada database yang belum dimigrasi. */
export const LEGACY_PENDING_STATUSES = [
  'PENDING_STAFF',
  'PENDING_HEAD',
  'PENDING_ADMIN_UMUM',
] as const;

export const PENDING_APPROVAL_STATUSES: string[] = [APPROVAL_STATUS, ...LEGACY_PENDING_STATUSES];

/** Status peminjaman yang mendapat persetujuan bersama. */
export const BLOCKING_LOAN_STATUSES: string[] = [
  APPROVAL_STATUS,
  ...LEGACY_PENDING_STATUSES,
  'APPROVED',
  'IN_USE',
];

export interface ApprovalSnapshot {
  status?: string | null;
  staff_verified_at?: string | null;
  staff_verified_by?: string | null;
  head_approved_at?: string | null;
  head_approved_by?: string | null;
  admin_umum_approved_at?: string | null;
  admin_umum_approved_by?: string | null;
}

export function isPendingApproval(status?: string | null): boolean {
  return !!status && PENDING_APPROVAL_STATUSES.includes(status);
}

export function hasStageSigned(loan: ApprovalSnapshot | null | undefined, stage: ApprovalStage): boolean {
  if (!loan) return false;
  const meta = APPROVAL_STAGE_META[stage];
  return Boolean(loan[meta.atField as keyof ApprovalSnapshot] && loan[meta.byField as keyof ApprovalSnapshot]);
}

export function countApprovals(loan: ApprovalSnapshot | null | undefined): number {
  return APPROVAL_STAGES.filter((stage) => hasStageSigned(loan, stage)).length;
}

export function isFullyApproved(loan: ApprovalSnapshot | null | undefined): boolean {
  return countApprovals(loan) === TOTAL_APPROVAL_STAGES;
}

export function awaitingStages(loan: ApprovalSnapshot | null | undefined): ApprovalStage[] {
  return APPROVAL_STAGES.filter((stage) => !hasStageSigned(loan, stage));
}

/** Tahap yang menjadi kewenangan utama sebuah role. */
export function stageForRole(role?: string | null): ApprovalStage | null {
  if (!role) return null;
  const found = APPROVAL_STAGES.find((stage) => APPROVAL_STAGE_META[stage].role === role);
  return found ?? null;
}

/**
 * Pemisahan kewenangan persetujuan.
 *
 * Checklist Staff hanya untuk `STAFF_SARPRAS`, checklist Kepala Bagian hanya untuk
 * `KEPALA_SARPRAS`, dan checklist Administrasi hanya untuk `KEPALA_ADMIN_UMUM`.
 * Tidak ada role yang boleh menandatangani checklist milik role lain.
 *
 * `ADMIN` tetap dapat menutupi seluruh tahap sebagai kewenangan cadangan,
 * namun antarmuka menampilkan peringatan konfirmasi sebelum menandatangani tahap
 * yang bukan miliknya.
 */
export function canSignStage(role?: string | null, stage?: ApprovalStage | null): boolean {
  if (!role || !stage) return false;
  if (role === 'ADMIN') return true;
  return APPROVAL_STAGE_META[stage].role === role;
}

/** True bila tahap tersebut milik role pengguna sendiri, bukan lewat kewenangan ADMIN. */
export function isOwnStage(role?: string | null, stage?: ApprovalStage | null): boolean {
  if (!role || !stage) return false;
  return APPROVAL_STAGE_META[stage].role === role;
}

/** Daftar tahap yang boleh ditangani oleh role tersebut. Kosong berarti tidak berwenang. */
export function signableStages(role?: string | null): ApprovalStage[] {
  return APPROVAL_STAGES.filter((stage) => canSignStage(role, stage));
}

export const APPROVER_ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  STAFF_SARPRAS: 'Staff Sarpras',
  KEPALA_SARPRAS: 'Kepala Bagian Sarpras',
  KEPALA_ADMIN_UMUM: 'Kepala Administrasi Umum',
};

/** Pesan penolakan kewenangan yang dipakai bersama oleh ketiga endpoint persetujuan. */
export function forbiddenStageMessage(stage: ApprovalStage) {
  const stageLabel = APPROVAL_STAGE_META[stage].label;
  const ownerLabel = APPROVER_ROLE_LABEL[APPROVAL_STAGE_META[stage].role];
  return `Akses ditolak. ${stageLabel} hanya bisa diisi oleh ${ownerLabel}.`;
}

/** Ringkasan progres tanda tangan, mis. "2 dari 3 tanda tangan". */
export function approvalProgressLabel(loan: ApprovalSnapshot | null | undefined): string {
  const done = countApprovals(loan);
  return `${done} dari ${TOTAL_APPROVAL_STAGES} tanda tangan`;
}
