export const ASSET_TYPES = {
  INVENTARIS: 'INVENTARIS',
  SARANA_PRASARANA: 'SARANA_PRASARANA',
} as const;

export type AssetType = (typeof ASSET_TYPES)[keyof typeof ASSET_TYPES];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [ASSET_TYPES.INVENTARIS]: 'Inventaris Aset',
  [ASSET_TYPES.SARANA_PRASARANA]: 'Sarana Prasarana (Dapat Dipinjam)',
};

export function isAssetType(value: unknown): value is AssetType {
  return value === ASSET_TYPES.INVENTARIS || value === ASSET_TYPES.SARANA_PRASARANA;
}

export function isLoanableAsset(asset: { asset_type?: string | null }) {
  return asset.asset_type === ASSET_TYPES.SARANA_PRASARANA;
}

export function getSuggestedAssetType(category: string): AssetType {
  return ['VEHICLE', 'ROOM', 'BUILDING'].includes(category.toUpperCase())
    ? ASSET_TYPES.SARANA_PRASARANA
    : ASSET_TYPES.INVENTARIS;
}
