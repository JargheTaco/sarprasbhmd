export const ASSET_TYPES = {
  INVENTARIS: 'INVENTARIS',
  SARANA_PRASARANA: 'SARANA_PRASARANA',
} as const;

export type AssetType = (typeof ASSET_TYPES)[keyof typeof ASSET_TYPES];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [ASSET_TYPES.INVENTARIS]: 'Inventaris Aset',
  [ASSET_TYPES.SARANA_PRASARANA]: 'Sarana Prasarana (Dapat Dipinjam)',
};

const LOANABLE_CATEGORIES = ['VEHICLE', 'ROOM', 'BUILDING'];
const LOANABLE_KEYWORDS = ['sarpras', 'proyektor', 'projector', 'kabel'];

interface AssetTypeSource {
  category?: string | null;
  name?: string | null;
  location?: string | null;
  specs?: string | null;
  asset_type?: string | null;
}

export function isAssetType(value: unknown): value is AssetType {
  return value === ASSET_TYPES.INVENTARIS || value === ASSET_TYPES.SARANA_PRASARANA;
}

export function getSuggestedAssetType(category: string, searchableText = ''): AssetType {
  const text = searchableText.toLowerCase();
  const loanable =
    LOANABLE_CATEGORIES.includes((category || '').toUpperCase()) ||
    LOANABLE_KEYWORDS.some((keyword) => text.includes(keyword));
  return loanable ? ASSET_TYPES.SARANA_PRASARANA : ASSET_TYPES.INVENTARIS;
}

/**
 * Menentukan jenis katalog aset. Memakai nilai `asset_type` yang tersimpan bila tersedia,
 * jika belum (misalnya database lama belum menjalankan migrasi) memakai heuristics kategori.
 */
export function resolveAssetType(asset: AssetTypeSource): AssetType {
  if (isAssetType(asset.asset_type)) return asset.asset_type;
  const searchableText = [asset.name, asset.location, asset.specs].filter(Boolean).join(' ');
  return getSuggestedAssetType(asset.category || '', searchableText);
}

export function isLoanableAsset(asset: AssetTypeSource) {
  return resolveAssetType(asset) === ASSET_TYPES.SARANA_PRASARANA;
}

export function isMissingColumn(error: { code?: string } | null | undefined) {
  return error?.code === '42703' || error?.code === 'PGRST203' || error?.code === 'PGRST204';
}

/** Menghapus asset_type dari payload agar penulisan tetap berhasil pada database lama. */
export function withoutAssetType<T extends { asset_type?: unknown }>(payload: T): Omit<T, 'asset_type'> {
  const rest = { ...payload };
  delete rest.asset_type;
  return rest as Omit<T, 'asset_type'>;
}
