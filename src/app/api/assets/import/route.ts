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
  const negative = value.includes('(') && value.includes(')');
  const cleaned = value.replace(/rp\.?/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
  const parsed = Number(cleaned.replace(/[^\d-]/g, ''));
  return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : 0;
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

function findHeaderIndex(headers: string[], ...names: string[]) {
  return headers.findIndex((header) => names.some((name) => header.includes(normalize(name))));
}

function databaseErrorMessage(error: { code?: string; message?: string; details?: string }) {
  if (error.code === '23505') {
    return 'Ada kode inventaris yang sudah terdaftar. Data yang sama dilewati, tetapi periksa kembali kode pada CSV.';
  }
  if (error.code === '42703' || error.code === 'PGRST204') {
    return 'Kolom inventaris terbaru belum tersedia di Supabase. Jalankan supabase-schema.sql terlebih dahulu.';
  }
  if (error.code === '22P02' || error.code === '22007') {
    return 'Format angka atau tanggal pada CSV tidak valid. Periksa kolom tanggal dan harga perolehan.';
  }
  return error.message || error.details || 'Supabase menolak data inventaris.';
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
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
    const defaultBuilding = String(formData.get('building') || '').trim();
    const defaultRoom = String(formData.get('room') || '').trim();

    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV tidak berisi data inventaris.' }, { status: 400 });
    }

    const headerRowIndex = rows.findIndex((row) => {
      const values = row.map(normalize);
      return values.some((value) => value.includes('jenis barang')) && values.some((value) => value.includes('keberadaan') || value.includes('keterangan') || value.includes('ruang'));
    });
    if (headerRowIndex < 0) {
      return NextResponse.json({ error: 'Header CSV tidak ditemukan. Pastikan ada kolom Jenis Barang dan Keberadaan.' }, { status: 400 });
    }

    const headers = rows[headerRowIndex].map(normalize);
    const nameIndex = findHeaderIndex(headers, 'jenis barang', 'nama barang', 'nama');
    const codeStartIndex = findHeaderIndex(headers, 'no inventaris', 'nomor inventaris');
    const dateIndex = findHeaderIndex(headers, 'tanggal perolehan', 'tanggal pembelian', 'purchase date', 'tanggal');
    const priceIndex = findHeaderIndex(headers, 'harga pembelian', 'harga perolehan', 'harga');
    const depreciationIndex = findHeaderIndex(headers, 'nilai penyusutan', 'nilai penyu', 'penyusutan');
    const bookValueIndex = findHeaderIndex(headers, 'nilai buku');
    const locationIndex = findHeaderIndex(headers, 'keberadaan', 'lokasi', 'location');
    const buildingIndex = findHeaderIndex(headers, 'gedung', 'building');
    const roomIndex = findHeaderIndex(headers, 'ruang', 'kelas', 'room');
    const fundingIndex = findHeaderIndex(headers, 'sumber dana');
    const conditionIndex = findHeaderIndex(headers, 'keadaan', 'kondisi');
    const yearIndex = findHeaderIndex(headers, 'th', 'tahun');
    const dataRows = rows.slice(headerRowIndex + 1).map((values) => {
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      if (codeStartIndex >= 0) {
        const codeParts = values.slice(codeStartIndex, dateIndex > codeStartIndex ? dateIndex : codeStartIndex + 1).filter(Boolean);
        row[normalize('no inventaris')] = codeParts.join('/');
      }
      if (!column(row, 'jenis barang', 'nama barang', 'nama', 'name') && nameIndex >= 0) {
        row[normalize('jenis barang')] = values[nameIndex] || '';
      }
      if (dateIndex >= 0) {
        row[normalize('tanggal perolehan')] = [values[dateIndex], values[dateIndex + 1], values[dateIndex + 2]].filter(Boolean).join(' ');
      }
      if (priceIndex >= 0) row[normalize('harga pembelian')] = values[priceIndex] || '';
      if (depreciationIndex >= 0) {
        row[normalize('nilai penyusutan 10%')] = values[depreciationIndex] || '';
        row[normalize('penyusutan th lalu')] = values[depreciationIndex + 1] || '';
        row[normalize('penyusutan th ini')] = values[depreciationIndex + 2] || '';
      }
      if (bookValueIndex >= 0) row[normalize('nilai buku')] = values[bookValueIndex] || '';
      if (locationIndex >= 0) row[normalize('keberadaan')] = values[locationIndex] || '';
      if (buildingIndex >= 0) row[normalize('gedung')] = values[buildingIndex] || '';
      if (roomIndex >= 0) row[normalize('ruang')] = values[roomIndex] || '';
      if (fundingIndex >= 0) row[normalize('sumber dana')] = values[fundingIndex] || '';
      if (conditionIndex >= 0) row[normalize('keadaan')] = values[conditionIndex] || '';
      if (yearIndex >= 0) row[normalize('th')] = values[yearIndex] || '';
      return row;
    });
    const codes = dataRows.map((row) => column(row, 'no inventaris', 'nomor inventaris', 'kode', 'code')).filter(Boolean).map((code) => code.toUpperCase());
    const existingAssets: { code: string }[] = [];
    for (const codeBatch of chunks(codes, 250)) {
      const { data, error } = await supabaseAdmin.from('assets').select('code').in('code', codeBatch);
      if (error) {
        return NextResponse.json({ error: `Gagal memeriksa kode inventaris: ${databaseErrorMessage(error)}` }, { status: 400 });
      }
      existingAssets.push(...(data || []));
    }
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
      const building = column(row, 'gedung', 'building') || defaultBuilding || location;
      const room = column(row, 'ruang', 'kelas', 'room') || defaultRoom || location;
      const purchaseDate = column(row, 'tanggal perolehan', 'tanggal pembelian', 'purchase date');
      const year = Number(column(row, 'th', 'tahun', 'tahun perolehan')) || (purchaseDate.match(/\d{4}/)?.[0] ? Number(purchaseDate.match(/\d{4}/)?.[0]) : new Date().getFullYear());
      assets.push({
        id: `ast_import_${Date.now()}_${assets.length}_${Math.random().toString(36).slice(2, 6)}`,
        code,
        name,
        category: column(row, 'kategori', 'category') || 'ELECTRONIC',
        building,
        room,
        location,
        condition: column(row, 'keadaan', 'kondisi') || 'BAIK',
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
        funding_source: column(row, 'sumber dana'),
        created_at: new Date().toISOString(),
      });
    }

    let imported = 0;
    if (assets.length) {
      for (const batch of chunks(assets, 250)) {
        const { error: insertError } = await supabaseAdmin.from('assets').insert(batch);
        if (insertError) {
          console.error('Import assets database error:', insertError);
          return NextResponse.json({
            error: `Gagal menyimpan batch data inventaris: ${databaseErrorMessage(insertError)}`,
            imported,
          }, { status: 400 });
        }
        imported += batch.length;
      }
    }

    return NextResponse.json({ success: true, imported, skipped: skipped.length, skippedCodes: skipped.slice(0, 20) });
  } catch (error) {
    console.error('Import assets error:', error);
    const message = error instanceof Error ? error.message : 'Gagal mengimpor data inventaris';
    return NextResponse.json({ error: `Gagal mengimpor data inventaris: ${message}` }, { status: 500 });
  }
}