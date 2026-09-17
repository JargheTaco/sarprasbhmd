import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Parse CSV line handling quotes
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

function parseCurrency(str) {
  if (!str) return 0;
  // Remove "Rp", ".", ",", spaces, parentheses (which might mean negative or formatted)
  const isNegative = str.includes('(') && str.includes(')');
  const cleaned = str.replace(/[Rp\s.,()]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

const months = {
  januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
  juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
};

function parseIndonesianDate(str, defaultYear) {
  if (!str) return defaultYear ? `${defaultYear}-01-01` : null;
  const parts = str.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const m = months[parts[1].toLowerCase()] || '01';
    const year = parts[2];
    if (/^\d{4}$/.test(year) && /^\d{2}$/.test(day)) {
      return `${year}-${m}-${day}`;
    }
  }
  if (defaultYear && /^\d{4}$/.test(String(defaultYear))) {
    return `${defaultYear}-01-01`;
  }
  return null;
}

function determineBuildingAndRoom(locationStr) {
  const loc = (locationStr || '').trim();
  const lower = loc.toLowerCase();

  if (lower.includes('lab.farmasi') || lower.includes('lab farmasi')) {
    return { building: 'Gedung Farmasi', room: 'Laboratorium Farmasi' };
  }
  if (lower.includes('lab bidan') || lower.includes('kebidanan')) {
    return { building: 'Gedung Kebidanan', room: 'Laboratorium Kebidanan' };
  }
  if (lower.includes('lab perawat') || lower.includes('keperawatan')) {
    return { building: 'Gedung Keperawatan', room: 'Laboratorium Keperawatan' };
  }
  if (lower.includes('lab komp') || lower.includes('komputer')) {
    return { building: 'Gedung D1', room: 'Laboratorium Komputer D1' };
  }
  if (lower.includes('d1.1') || lower.includes('multimedia')) {
    return { building: 'Gedung D1', room: 'Ruang D1.1 / R.MULTIMEDIA' };
  }
  if (lower.startsWith('d1.') || lower.startsWith('gedung d')) {
    return { building: 'Gedung D1', room: `Ruang ${loc}` };
  }
  if (lower.includes('perpustakaan')) {
    return { building: 'Gedung Perpustakaan', room: 'Ruang Baca & Koleksi' };
  }
  if (lower.includes('bau')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang BAU (Biro Administrasi Umum)' };
  }
  if (lower.includes('baak')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang BAAK' };
  }
  if (lower.includes('ketua') || lower.includes('rektor')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang Rektor / Ketua' };
  }
  if (lower.includes('waket i') || lower.includes('warek i')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang Wakil Rektor I' };
  }
  if (lower.includes('waket ii') || lower.includes('warek ii')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang Wakil Rektor II' };
  }
  if (lower.includes('waket iii') || lower.includes('warek iii')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang Wakil Rektor III' };
  }
  if (lower.includes('personalia') || lower.includes('sdm')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang Kepegawaian / Personalia' };
  }
  if (lower.includes('lppm')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang LPPM' };
  }
  if (lower.includes('bpm') || lower.includes('penjaminan mutu')) {
    return { building: 'Gedung Rektorat & Administrasi', room: 'Ruang Penjaminan Mutu (BPM)' };
  }
  if (lower.includes('kelas a')) {
    return { building: 'Gedung A', room: loc.replace(/kelas\s*/i, 'Ruang Kelas ') };
  }
  if (lower.includes('kelas b')) {
    return { building: 'Gedung B', room: loc.replace(/kelas\s*/i, 'Ruang Kelas ') };
  }
  if (lower.includes('kelas c')) {
    return { building: 'Gedung C', room: loc.replace(/kelas\s*/i, 'Ruang Kelas ') };
  }
  if (lower.includes('kelas')) {
    return { building: 'Gedung Perkuliahan Terpadu', room: `Ruang ${loc}` };
  }
  if (lower.includes('aula')) {
    return { building: 'Gedung Serbaguna', room: 'Aula Utama Tri Sanja' };
  }
  if (lower.includes('pos satpam') || lower.includes('security')) {
    return { building: 'Pos Keamanan', room: 'Pos Satpam Utama' };
  }

  return {
    building: 'Gedung Kampus Bhamada',
    room: loc || 'Ruang Serbaguna'
  };
}

function determineCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('meja') || n.includes('kursi') || n.includes('lemari') || n.includes('rak') || n.includes('partisi') || n.includes('papan')) {
    return 'FURNITURE';
  }
  if (n.includes('mobil') || n.includes('motor') || n.includes('bus') || n.includes('hiace') || n.includes('innova') || n.includes('avanza')) {
    return 'VEHICLE';
  }
  if (n.includes('aula') || n.includes('gedung') || n.includes('ruang')) {
    return 'ROOM';
  }
  if (n.includes('genset') || n.includes('panel') || n.includes('trafo') || n.includes('kelistrikan')) {
    return 'ELECTRICAL';
  }
  if (n.includes('mesin') || n.includes('genset')) {
    return 'MACHINERY';
  }
  return 'ELECTRONIC';
}

async function seed() {
  console.log('=== MEMULAI SEEDING INVENTARIS UNIVERSITAS BHAMADA SLAWI ===');

  // 1. Data D1.1 / R.MULTIMEDIA (KIR Image Bhamada)
  const d1Items = [
    {
      code: '20.01.06.0001.D1.1.01.20',
      name: 'Meja Komputer Multi Partisi',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 3,
      funding_source: 'YPTSH',
      purchase_year: 2020,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Multi Partisi, Luas Ruang 80 m², Kartu Inventaris Ruangan D1.1',
      purchase_price: 4500000,
    },
    {
      code: '20.01.16.0001.D1.1.01.15',
      name: 'Meja Baca Kayu Polisture',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 4,
      funding_source: 'YPTSH',
      purchase_year: 2015,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Kayu Polisture Berkualitas, Luas Ruang 80 m², KIR D1.1',
      purchase_price: 3200000,
    },
    {
      code: '20.01.05.0001.D1.1.01.10',
      name: 'Meja Komputer kayu Polisture',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 2,
      funding_source: 'YPTSH',
      purchase_year: 2010,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Kayu Polisture, Luas Ruang 80 m², KIR D1.1',
      purchase_price: 1800000,
    },
    {
      code: '20.04.10.0001.D1.1.01.19',
      name: 'Kursi Tumpuk',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 14,
      funding_source: 'YPTSH',
      purchase_year: 2019,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Kursi Tumpuk Bhamada Busa Tebal, Luas Ruang 80 m², KIR D1.1',
      purchase_price: 3500000,
    },
    {
      code: '20.04.02.0001.D1.1.01.10',
      name: 'Kursi Lipat Stenlis',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 5,
      funding_source: 'YPTSH',
      purchase_year: 2015,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Pipa Stainless Steel Awet, Luas Ruang 80 m², KIR D1.1',
      purchase_price: 1250000,
    },
    {
      code: '20.03.01.0001.D1.1.01.21',
      name: 'Rak Partisi',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 1,
      funding_source: 'YPTSH',
      purchase_year: 2021,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Rak Partisi Ruangan Kayu & Rangka Metal, KIR D1.1',
      purchase_price: 2750000,
    },
    {
      code: '20.01.07.0001.D1.1.01.21',
      name: 'Meja Komputer Partisi',
      category: 'FURNITURE',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 1,
      funding_source: 'YPTSH',
      purchase_year: 2021,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Spesifikasi: Meja Partisi Single, Luas Ruang 80 m², KIR D1.1',
      purchase_price: 1600000,
    },
    {
      code: '21.02.03.0001.D1.1.01.19',
      name: 'AC Daikin 2 pk',
      category: 'ELECTRONIC',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 1,
      funding_source: 'YPTSH',
      purchase_year: 2019,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Merk: Daikin 2 PK Split Wall R32, Dingin Prima, KIR D1.1',
      purchase_price: 8500000,
    },
    {
      code: '21.02.03.0001.D1.1.01.20',
      name: 'Panasonic 2 pk',
      category: 'ELECTRONIC',
      building: 'Gedung D1',
      room: 'Ruang D1.1 / R.MULTIMEDIA',
      capacity: 1,
      funding_source: 'YPTSH',
      purchase_year: 2020,
      condition: 'BAIK',
      status: 'TERSEDIA',
      specs: 'Merk: Panasonic 2 PK Standard Non-Inverter, Luas Ruang 80 m², KIR D1.1',
      purchase_price: 8700000,
    },
  ];

  console.log(`Menyiapkan ${d1Items.length} item KIR Ruang D1.1 Multimedia...`);

  // 2. Data CSV Barang Elektronik Bhamada
  const csvPath = path.join(process.cwd(), 'data', 'inventaris_bhamada_raw.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);

  const csvItems = [];
  // Skip header line 0
  for (let i = 1; i < csvLines.length; i++) {
    const row = parseCsvLine(csvLines[i]);
    if (row.length < 10) continue;

    // Headers: No., Jenis Barang, No. Inventaris, Tanggal Perolehan, Th. Pembelian, Harga Pembelian, Nilai Penyusutan 10%, Nilai Penyusutan Th.Lalu, Nilai Buku, Keberadaan, Sumber Dana, Keadaan
    const no = row[0];
    const jenisBarang = row[1];
    let noInv = row[2];
    const tglPerolehan = row[3];
    const thPembelian = parseInt(row[4], 10) || 2015;
    const hargaBeli = parseCurrency(row[5]);
    const susut10 = parseCurrency(row[6]);
    const susutLalu = parseCurrency(row[7]);
    const nilaiBuku = parseCurrency(row[8]);
    const keberadaan = row[9];
    const sumberDana = row[10] || 'YPTSH';
    const keadaanRaw = (row[11] || '').toLowerCase();

    if (!noInv) {
      noInv = `BMD/INV/AUTO/${i}`;
    }

    const { building, room } = determineBuildingAndRoom(keberadaan);
    const category = determineCategory(jenisBarang);

    let condition = 'BAIK';
    if (keadaanRaw.includes('rusak berat')) condition = 'RUSAK_BERAT';
    else if (keadaanRaw.includes('rusak')) condition = 'RUSAK_RINGAN';

    csvItems.push({
      code: noInv.trim().toUpperCase(),
      name: jenisBarang.trim(),
      category,
      building,
      room,
      location: `${building} - ${room}`,
      condition,
      status: 'TERSEDIA',
      specs: `Merk/Tipe: ${jenisBarang.trim()} | Sumber Dana: ${sumberDana} | Lokasi: ${keberadaan}`,
      capacity: 1,
      purchase_year: thPembelian,
      purchase_date: parseIndonesianDate(tglPerolehan, thPembelian),
      purchase_price: Math.abs(hargaBeli),
      depreciation_rate: 10.00,
      depreciation_current: Math.abs(susut10),
      depreciation_previous: Math.abs(susutLalu),
      book_value: Math.abs(nilaiBuku),
      funding_source: sumberDana,
    });
  }

  console.log(`Membaca ${csvItems.length} item dari CSV inventaris elektronik Bhamada...`);

  // Gabungkan semua item
  const allNewAssets = [...d1Items.map(item => ({
    ...item,
    location: `${item.building} - ${item.room}`,
    purchase_date: `${item.purchase_year}-01-01`,
    depreciation_rate: 10.00,
    depreciation_current: 0,
    depreciation_previous: 0,
    book_value: item.purchase_price,
  })), ...csvItems];

  // Insert or Upsert into Supabase in chunks of 50
  const chunkSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < allNewAssets.length; i += chunkSize) {
    const chunk = allNewAssets.slice(i, i + chunkSize);
    
    // Siapkan id dan format
    const rows = chunk.map((item, idx) => ({
      id: `bmd_${item.code.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${i + idx}`,
      code: item.code,
      name: item.name,
      category: item.category,
      building: item.building,
      room: item.room,
      location: item.location,
      condition: item.condition,
      status: item.status,
      specs: item.specs,
      capacity: item.capacity || 1,
      purchase_year: item.purchase_year || 2020,
      purchase_date: item.purchase_date || null,
      purchase_price: item.purchase_price || 0,
      depreciation_rate: item.depreciation_rate || 0,
      depreciation_previous: item.depreciation_previous || 0,
      book_value: item.book_value || 0,
      funding_source: item.funding_source || 'YPTSH',
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('assets').upsert(rows, { onConflict: 'code' });
    if (error) {
      console.error(`Error inserting chunk ${i} - ${i + chunk.length}:`, error.message);
    } else {
      totalInserted += chunk.length;
      console.log(`Berhasil menyimpan ${totalInserted}/${allNewAssets.length} aset...`);
    }
  }

  console.log('=== SEEDING INVENTARIS BHAMADA SLAWI SELESAI! ===');
  console.log(`Total data terintegrasi: ${totalInserted} barang.`);
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
