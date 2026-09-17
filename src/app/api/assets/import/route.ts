import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if ((character === ',' || character === ';') && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[.:/()_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function numberValue(value?: string) {
  if (!value) return 0;
  const cleaned = value.replace(/rp\.?/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const months: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
  };
  const match = value.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!match || !months[match[2]]) return null;
  return `${match[3]}-${months[match[2]]}-${match[1].padStart(2, '0')}`;
}

function column(row: Record<string, string>, ...names: string[]) {
  for (const name of names) {
    if (row[normalize(name)] !== undefined) return row[normalize(name)];
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF_SARPRAS')) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Petugas/Admin yang dapat mengimpor inventaris.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File CSV inventaris wajib dipilih.' }, { status: 400 });
    }

    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV tidak berisi data inventaris.' }, { status: 400 });
    }

    const headers = rows[0].map(normalize);
    const dataRows = rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
    const codes = dataRows.map((row) => column(row, 'no inventaris', 'nomor inventaris', 'kode', 'code')).filter(Boolean).map((code) => code.toUpperCase());
    const { data: existingAssets, error: existingError } = await supabaseAdmin.from('assets').select('code').in('code', codes);
    if (existingError) throw existingError;
    const existingCodes = new Set((existingAssets || []).map((asset) => asset.code));
    const seenCodes = new Set<string>();
    const assets = [];
    const skipped: string[] = [];

    for (const row of dataRows) {
      const code = column(row, 'no inventaris', 'nomor inventaris', 'kode', 'code').toUpperCase();
      const name = column(row, 'jenis barang', 'nama barang', 'nama', 'name');
      if (!code || !name) continue;
      if (existingCodes.has(code) || seenCodes.has(code)) {
        skipped.push(code);
        continue;
      }
      seenCodes.add(code);
      const location = column(row, 'keberadaan', 'lokasi', 'location') || 'Belum Ditentukan';
      const purchaseDate = column(row, 'tanggal perolehan', 'tanggal pembelian', 'purchase date');
      const year = Number(column(row, 'th', 'tahun', 'tahun perolehan')) || (purchaseDate.match(/\d{4}/)?.[0] ? Number(purchaseDate.match(/\d{4}/)?.[0]) : new Date().getFullYear());
      assets.push({
        id: `ast_import_${Date.now()}_${assets.length}_${Math.random().toString(36).slice(2, 6)}`,
        code,
        name,
        category: column(row, 'kategori', 'category') || 'GENERAL',
        building: location,
        room: location,
        location,
        condition: 'BAIK',
        status: 'TERSEDIA',
        specs: column(row, 'spesifikasi', 'keterangan', 'rincian'),
        capacity: 0,
        purchase_year: year,
        purchase_date: dateValue(purchaseDate),
        purchase_price: numberValue(column(row, 'harga pembelian', 'harga perolehan')),
        depreciation_rate: numberValue(column(row, 'nilai penyusutan 10%', 'penyusutan 10%')),
        depreciation_previous: numberValue(column(row, 'nilai penyusutan th lalu', 'penyusutan th lalu')),
        depreciation_current: numberValue(column(row, 'nilai penyusutan th ini', 'penyusutan th ini')),
        book_value: numberValue(column(row, 'nilai buku')),
        created_at: new Date().toISOString(),
      });
    }

    if (assets.length) {
      const { error: insertError } = await supabaseAdmin.from('assets').insert(assets);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, imported: assets.length, skipped: skipped.length, skippedCodes: skipped.slice(0, 20) });
  } catch (error) {
    console.error('Import assets error:', error);
    return NextResponse.json({ error: 'Gagal mengimpor data inventaris. Pastikan format CSV sesuai contoh.' }, { status: 500 });
  }
}