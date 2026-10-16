import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { inventoryPages as part1 } from './data_part1.mjs';
import { inventoryPart2 as part2 } from './data_part2.mjs';
import { inventoryPart3 as part3 } from './data_part3.mjs';
import { inventoryPart4 as part4 } from './data_part4.mjs';
import { inventoryPart5 as part5 } from './data_part5.mjs';
import { inventoryPart6 as part6 } from './data_part6.mjs';

const allRooms = [...part1, ...part2, ...part3, ...part4, ...part5, ...part6];

function getCategory(name) {
  const n = (name || '').toLowerCase();
  
  // Prioritas AC / Brand AC
  if (
    n.includes('ac') || n.includes('panasonic') || n.includes('daikin') ||
    n.includes('gree') || n.includes('sharp') || n.includes('panalia')
  ) {
    return 'ELECTRONIC';
  }

  // Prioritas Lemari & Mebel (walaupun ada kata kaca / almunium)
  if (
    n.includes('meja') || n.includes('kursi') || n.includes('sofa') ||
    n.includes('rak') || n.includes('bufet') || n.includes('buffet') ||
    n.includes('almari') || n.includes('alamari') || n.includes('akmari') ||
    n.includes('whiteboard') || n.includes('white board') || n.includes('papan') ||
    n.includes('etalase') || n.includes('konter') || n.includes('bingkai') ||
    n.includes('loker')
  ) {
    return 'FURNITURE';
  }

  // Peralatan Elektronik & IT
  if (
    n.includes('komputer') || n.includes('cpu') || n.includes('monitor') ||
    n.includes('keyboard') || n.includes('laptop') || n.includes('lap top') ||
    n.includes('printer') || n.includes('proyektor') || n.includes('projektor') ||
    n.includes('tripod') || n.includes('speaker') || n.includes('sound') ||
    n.includes('amplifier') || n.includes('ampl;ifier') || n.includes('mic') ||
    n.includes('tv') || n.includes('televisi') || n.includes('kulkas') ||
    n.includes('dispenser') || n.includes('dispencer') || n.includes('showcase') ||
    n.includes('socase') || n.includes('soucas') || n.includes('mixer') ||
    n.includes('exhaust') || n.includes('exhase') || n.includes('kipas') ||
    n.includes('switch') || n.includes('hub') || n.includes('sweet') ||
    n.includes('cooler') || n.includes('pendingin')
  ) {
    return 'ELECTRONIC';
  }

  if (n.includes('pemadam') || n.includes('apar') || n.includes('sampah') || n.includes('wastafel') || n.includes('bunga')) {
    return 'OTHER';
  }
  return 'FURNITURE';
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

console.log(`Processing total rooms: ${allRooms.length}`);

// Track codes to make sure every code is uniquely assigned
const seenCodes = new Map();
const processedItems = [];

let totalRows = 0;

for (const r of allRooms) {
  const buildingLabel = r.building.startsWith('Gedung') ? r.building : `Gedung ${r.building}`;
  const roomLabel = r.room;
  const areaLabel = r.area || '80 m2';

  for (const it of r.items) {
    totalRows++;
    let code = (it.code || '').trim().replace(/,/g, '.');
    if (!code) {
      code = `20.00.00.0000.${r.building}.${it.no}.${it.year || 2020}`;
    }

    // Check code uniqueness
    if (seenCodes.has(code)) {
      const count = seenCodes.get(code) + 1;
      seenCodes.set(code, count);
      // Disambiguate duplicate code so DB unique constraint won't fail
      code = `${code}-${String.fromCharCode(64 + count)}`; // -B, -C, etc.
    } else {
      seenCodes.set(code, 1);
    }

    const category = getCategory(it.name);
    const specsWithArea = it.specs ? `${it.specs}; Luas: ${areaLabel}` : `Luas: ${areaLabel}`;
    const id = `ast_kir_${crypto.createHash('md5').update(`${code}_${roomLabel}`).digest('hex').slice(0, 16)}`;

    processedItems.push({
      id,
      code,
      name: it.name.trim(),
      category,
      asset_type: 'INVENTARIS',
      building: buildingLabel,
      room: roomLabel,
      location: `${buildingLabel} - ${roomLabel}`,
      condition: (it.cond || 'Baik').toUpperCase() === 'BAIK' ? 'BAIK' : 'RUSAK_RINGAN',
      status: 'TERSEDIA',
      specs: specsWithArea,
      capacity: it.qty || 1,
      purchase_year: it.year || null,
      funding_source: it.source || 'YPTSH'
    });
  }
}

console.log(`Total processed items: ${processedItems.length}`);

// Generate SQL content
const sqlLines = [];

sqlLines.push(`-- =============================================================================`);
sqlLines.push(`-- IMPORT LENGKAP INVENTARIS SARANA PRASARANA UNIVERSITAS BHAMADA SLAWI`);
sqlLines.push(`-- T.A 2025 / 2026 (Seluruh Gedung & Ruangan: D1, D2, C2, E1, E2, F1, F2, H2, B1, B2, B3, A, H1, K, L)`);
sqlLines.push(`-- Total: ${processedItems.length} Aset Terdata`);
sqlLines.push(`-- Cara Pakai: Buka Supabase Dashboard -> SQL Editor -> Salin & Tempel -> Run`);
sqlLines.push(`-- =============================================================================\n`);

sqlLines.push(`BEGIN;\n`);

sqlLines.push(`-- 1. Pastikan kolom pendukung tersedia di tabel assets`);
sqlLines.push(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS building text NOT NULL DEFAULT 'Belum Ditentukan';`);
sqlLines.push(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS room text NOT NULL DEFAULT 'Belum Ditentukan';`);
sqlLines.push(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_year integer;`);
sqlLines.push(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS funding_source text;`);
sqlLines.push(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'INVENTARIS';\n`);

sqlLines.push(`-- 2. Memasukkan atau memperbarui seluruh data inventaris`);
sqlLines.push(`INSERT INTO assets (`);
sqlLines.push(`  id, code, name, category, asset_type, building, room, location, condition, status, specs, capacity, purchase_year, funding_source`);
sqlLines.push(`) VALUES`);

const valueRows = processedItems.map((item, idx) => {
  const isLast = idx === processedItems.length - 1;
  return `  (${escapeSql(item.id)}, ${escapeSql(item.code)}, ${escapeSql(item.name)}, ${escapeSql(item.category)}, ${escapeSql(item.asset_type)}, ${escapeSql(item.building)}, ${escapeSql(item.room)}, ${escapeSql(item.location)}, ${escapeSql(item.condition)}, ${escapeSql(item.status)}, ${escapeSql(item.specs)}, ${item.capacity}, ${item.purchase_year ? item.purchase_year : 'NULL'}, ${escapeSql(item.funding_source)})${isLast ? '' : ','}`;
});

sqlLines.push(valueRows.join('\n'));

sqlLines.push(`ON CONFLICT (code) DO UPDATE SET`);
sqlLines.push(`  name = EXCLUDED.name,`);
sqlLines.push(`  category = EXCLUDED.category,`);
sqlLines.push(`  asset_type = EXCLUDED.asset_type,`);
sqlLines.push(`  building = EXCLUDED.building,`);
sqlLines.push(`  room = EXCLUDED.room,`);
sqlLines.push(`  location = EXCLUDED.location,`);
sqlLines.push(`  condition = EXCLUDED.condition,`);
sqlLines.push(`  specs = EXCLUDED.specs,`);
sqlLines.push(`  capacity = EXCLUDED.capacity,`);
sqlLines.push(`  purchase_year = EXCLUDED.purchase_year,`);
sqlLines.push(`  funding_source = EXCLUDED.funding_source;\n`);

sqlLines.push(`COMMIT;\n`);

sqlLines.push(`-- 3. Verifikasi jumlah data inventaris yang berhasil masuk per gedung`);
sqlLines.push(`SELECT building AS gedung, COUNT(*) AS jumlah_aset, SUM(capacity) AS total_unit_barang`);
sqlLines.push(`FROM assets`);
sqlLines.push(`WHERE asset_type = 'INVENTARIS'`);
sqlLines.push(`GROUP BY building`);
sqlLines.push(`ORDER BY building;\n`);

const outputPath = path.resolve('supabase-import-inventaris-lengkap.sql');
fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf8');

console.log(`SQL file written successfully: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
