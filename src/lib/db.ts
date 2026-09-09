import crypto from 'crypto';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sarpras.db');

// Global singleton database connection for Next.js hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var __sarpras_db: DatabaseSync | undefined;
}

function getDatabase(): DatabaseSync {
  if (global.__sarpras_db) {
    return global.__sarpras_db;
  }

  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 10000;');
    initSchema(db);
    seedInitialData(db);
  } catch (err) {
    // If another worker is already initializing, allow it to continue
    console.warn('Database init note:', (err as Error).message);
  }

  if (process.env.NODE_ENV !== 'production') {
    global.__sarpras_db = db;
  }

  return db;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'ADMIN', 'STAFF_SARPRAS', 'KEPALA_SARPRAS'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- 'VEHICLE', 'ROOM', 'ELECTRONIC', 'MACHINERY', 'ELECTRICAL', 'GENERAL'
      location TEXT NOT NULL,
      condition TEXT NOT NULL, -- 'BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'
      status TEXT NOT NULL, -- 'TERSEDIA', 'DIPINJAM', 'DALAM_PERAWATAN'
      specs TEXT,
      capacity INTEGER DEFAULT 0,
      purchase_year INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loan_requests (
      id TEXT PRIMARY KEY,
      ticket_code TEXT UNIQUE NOT NULL,
      borrower_name TEXT NOT NULL,
      borrower_id TEXT NOT NULL, -- NIM / NIP
      borrower_role TEXT NOT NULL, -- 'Mahasiswa', 'Dosen', 'Staff/Tendik', 'Ormawa/UKM'
      borrower_phone TEXT NOT NULL,
      borrower_email TEXT,
      asset_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_date TEXT NOT NULL,
      end_time TEXT NOT NULL,
      purpose TEXT NOT NULL,
      destination TEXT,
      driver_needed INTEGER DEFAULT 0,
      attachment_url TEXT,
      status TEXT NOT NULL, -- 'PENDING_STAFF', 'PENDING_HEAD', 'APPROVED', 'REJECTED', 'IN_USE', 'RETURNED', 'CANCELLED'
      staff_notes TEXT,
      head_notes TEXT,
      staff_checklist TEXT, -- JSON
      head_checklist TEXT,  -- JSON
      return_checklist TEXT, -- JSON
      staff_verified_at TEXT,
      staff_verified_by TEXT,
      head_approved_at TEXT,
      head_approved_by TEXT,
      picked_up_at TEXT,
      returned_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      asset_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'PREVENTIVE', 'CORRECTIVE'
      category TEXT NOT NULL, -- 'ELECTRONIC', 'MACHINERY', 'ELECTRICAL'
      title TEXT NOT NULL,
      description TEXT,
      technician_name TEXT,
      scheduled_date TEXT NOT NULL,
      completed_date TEXT,
      cost INTEGER DEFAULT 0,
      status TEXT NOT NULL, -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
      action_taken TEXT,
      spare_parts TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );
  `);
}

function seedInitialData(db: DatabaseSync) {
  const now = new Date().toISOString();
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 1. Admin
  insertUser.run(
    'usr_admin',
    'admin',
    hashPassword('admin123'),
    'Administrator Sarpras',
    'ADMIN',
    now
  );

  // 2. Staff Sarpras
  insertUser.run(
    'usr_staff',
    'staff',
    hashPassword('staff123'),
    'Rizky Pratama, S.T. (Staff Sarpras)',
    'STAFF_SARPRAS',
    now
  );

  // 3. Kepala Sarpras
  insertUser.run(
    'usr_kepala',
    'kepala',
    hashPassword('kepala123'),
    'Dr. Ir. Hendra Wijaya, M.T. (Kepala Bagian Sarpras)',
    'KEPALA_SARPRAS',
    now
  );

  // Check assets count
  const assetCount = db.prepare('SELECT COUNT(*) as cnt FROM assets').get() as { cnt: number };
  if (assetCount.cnt === 0) {
    const now = new Date().toISOString();
    const insertAsset = db.prepare(`
      INSERT OR IGNORE INTO assets (id, code, name, category, location, condition, status, specs, capacity, purchase_year, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Kendaraan / Mobil Kampus
    insertAsset.run(
      'ast_car_1',
      'MOB-001',
      'Toyota HiAce Commuter Kampus (B 1234 KMP)',
      'VEHICLE',
      'Pool Kendaraan Rektorat',
      'BAIK',
      'TERSEDIA',
      'Diesel 2.500cc, Kapasitas 16 Kursi Penumpang, Full AC, Audio & Mic, Layak Operasi Luar Kota',
      16,
      2022,
      now
    );

    insertAsset.run(
      'ast_car_2',
      'MOB-002',
      'Toyota Kijang Innova Reborn 2.4 G (B 5678 SAR)',
      'VEHICLE',
      'Pool Kendaraan Rektorat',
      'BAIK',
      'TERSEDIA',
      'Diesel Matic, Kapasitas 7 Penumpang, AC Double Blower, Mobil Dinas & Operasional Pimpinan/Dosen',
      7,
      2023,
      now
    );

    insertAsset.run(
      'ast_car_3',
      'MOB-003',
      'Bus Kampus Isuzu NQR 71 (B 9012 UNI)',
      'VEHICLE',
      'Pool Kendaraan Rektorat',
      'BAIK',
      'TERSEDIA',
      'Kapasitas 29 Kursi, Bagasi Luas, Sound System, Khusus Kegiatan Rombongan Mahasiswa / Ormawa',
      29,
      2021,
      now
    );

    // Ruang Kelas & Aula
    insertAsset.run(
      'ast_room_1',
      'RNG-101',
      'Ruang Kuliah Teater Graha Utama (A-201)',
      'ROOM',
      'Gedung Kuliah Bersama Lt. 2',
      'BAIK',
      'TERSEDIA',
      'Kapasitas 80 Mahasiswa, Meja Lipat Kursi Kuliah, Proyektor Dual Screen, 2 AC Standing 5 PK, Sound System Wireless',
      80,
      2020,
      now
    );

    insertAsset.run(
      'ast_room_2',
      'RNG-102',
      'Laboratorium Komputer Multimedia (B-102)',
      'ROOM',
      'Gedung Sains & Teknologi Lt. 1',
      'BAIK',
      'TERSEDIA',
      '40 Unit PC Core i7 RAM 16GB RTX 3060, Layar 24", LAN Gigabit, Smart TV 75", 3 AC Split 2 PK',
      40,
      2023,
      now
    );

    insertAsset.run(
      'ast_room_3',
      'RNG-103',
      'Auditorium Serbaguna Kampus',
      'ROOM',
      'Gedung Student Center Lt. 3',
      'BAIK',
      'TERSEDIA',
      'Kapasitas 500 Orang, Panggung Utama, Lighting Rig, Mixer Audio 32 Channel, VIP Room, 6 AC Central',
      500,
      2019,
      now
    );

    // Alat Pembelajaran Elektronik (Jobdesk 2)
    insertAsset.run(
      'ast_elk_1',
      'ELK-001',
      'Proyektor Laser Epson EB-L520U 5200 Lumens',
      'ELECTRONIC',
      'Gudang Sarpras Elektronik Lt. 1',
      'BAIK',
      'TERSEDIA',
      'Resolusi WUXGA Full HD, HDMI x2, Wireless Display, Sangat Terang untuk Presentasi Aula/Kelas Besar',
      1,
      2023,
      now
    );

    insertAsset.run(
      'ast_elk_2',
      'ELK-002',
      'Smart Interactive Whiteboard Promethean 75"',
      'ELECTRONIC',
      'Lab Microteaching Gedung C',
      'BAIK',
      'TERSEDIA',
      '4K UHD Touchscreen, OS Android & Windows OPS, Stylus Pen Dual, Kamera Konferensi 4K',
      1,
      2024,
      now
    );

    // Mesin & Workshop (Jobdesk 2)
    insertAsset.run(
      'ast_msn_1',
      'MSN-001',
      'Mesin Bubut CNC Mini Benchtop CQ6128',
      'MACHINERY',
      'Workshop Teknik Mesin Gedung Lab Terpadu',
      'BAIK',
      'DALAM_PERAWATAN',
      'Motor 1.5 kW, Panjang Kerja 750mm, Swing over bed 280mm, Untuk Praktikum Mahasiswa',
      1,
      2022,
      now
    );

    // Kelistrikan & Genset (Jobdesk 2)
    insertAsset.run(
      'ast_kls_1',
      'KLS-001',
      'Genset Silent Diesel 50 kVA Cummins Power',
      'ELECTRICAL',
      'Rumah Daya & Kelistrikan Barat',
      'BAIK',
      'TERSEDIA',
      'Output 40 kW / 50 kVA, 3 Phase 380V/220V, Panel ATS Otomatis, Backup Utama Gedung Rektorat & Server',
      1,
      2021,
      now
    );

    insertAsset.run(
      'ast_kls_2',
      'KLS-002',
      'Panel Distribusi Listrik Utama (LVMDP) Gedung Sains',
      'ELECTRICAL',
      'Ruang Panel Lt. Basement Gedung B',
      'BAIK',
      'TERSEDIA',
      'MCCB 630A Schneider, Kapasitor Bank 150 kVAR, Pengecekan Rutin Suhu Busbar',
      1,
      2020,
      now
    );
  }

  // Check sample loan requests
  const loanCount = db.prepare('SELECT COUNT(*) as cnt FROM loan_requests').get() as { cnt: number };
  if (loanCount.cnt === 0) {
    const insertLoan = db.prepare(`
      INSERT OR IGNORE INTO loan_requests (
        id, ticket_code, borrower_name, borrower_id, borrower_role, borrower_phone, borrower_email,
        asset_id, start_date, start_time, end_date, end_time, purpose, destination, driver_needed,
        status, staff_notes, head_notes, staff_checklist, head_checklist, return_checklist,
        staff_verified_at, staff_verified_by, head_approved_at, head_approved_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Tiket 1: Menunggu Verifikasi Staff (Baru diajukan oleh mahasiswa)
    insertLoan.run(
      'loan_sample_1',
      'SARPRAS-2026-0001',
      'Dimas Arya Wardhana',
      '22051204055',
      'Ormawa/UKM',
      '081234567890',
      'dimas.arya@mhs.ac.id',
      'ast_car_1', // Toyota HiAce
      '2026-09-12',
      '07:00',
      '2026-09-13',
      '21:00',
      'Kegiatan Pengabdian Masyarakat & Bakti Sosial BEM Fakultas di Desa Binaan Sukamaju',
      'Kec. Sukamaju, Kab. Bogor',
      1, // Butuh supir
      'PENDING_STAFF',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      '2026-09-08 09:30:00'
    );

    // Tiket 2: Menunggu Persetujuan Kepala Sarpras (Sudah diverifikasi staff)
    const staffChecklist2 = JSON.stringify({
      unit_available: true,
      physical_condition_ok: true,
      fuel_or_key_ready: true,
      documents_complete: true,
      notes: 'Unit Innova dalam kondisi bersih, oli dan bensin terisi. Surat tugas dosen terlampir lengkap.'
    });

    insertLoan.run(
      'loan_sample_2',
      'SARPRAS-2026-0002',
      'Dr. Budi Santoso, M.Kom.',
      '198503152010121002',
      'Dosen',
      '081398765432',
      'budi.santoso@dosen.ac.id',
      'ast_car_2', // Innova
      '2026-09-15',
      '08:00',
      '2026-09-15',
      '18:00',
      'Perjalanan Dinas Menghadiri Seminar Internasional AI & Teknologi Pendidikan di Hotel Grand Horison',
      'Pusat Konvensi Horison, Jakarta Pusat',
      1,
      'PENDING_HEAD',
      'Checklist staff lengkap. Jadwal armada kosong dan siap ditugaskan.',
      null,
      staffChecklist2,
      null,
      null,
      '2026-09-08 10:45:00',
      'Rizky Pratama, S.T.',
      null,
      null,
      '2026-09-07 15:20:00'
    );

    // Tiket 3: Sudah Disetujui Kepala Sarpras (APPROVED) - Siap Dipakai / Dicetak Surat Izinnya
    const staffChecklist3 = JSON.stringify({
      unit_available: true,
      physical_condition_ok: true,
      fuel_or_key_ready: true,
      documents_complete: true,
      notes: 'Ruang Aula bebas dari agenda lain, soundman dan teknisi AC sudah dijadwalkan standby.'
    });
    const headChecklist3 = JSON.stringify({
      priority_approved: true,
      schedule_approved: true,
      notes: 'Disetujui. Harap menjaga kebersihan dan ketertiban gedung pasca acara.'
    });

    insertLoan.run(
      'loan_sample_3',
      'SARPRAS-2026-0003',
      'Anisa Fitriani',
      '210411100088',
      'Ormawa/UKM',
      '085711223344',
      'himpunan.it@mhs.ac.id',
      'ast_room_3', // Auditorium
      '2026-09-20',
      '08:00',
      '2026-09-20',
      '17:00',
      'Seminar Nasional Teknologi Informasi & Expo Startup Mahasiswa 2026',
      'Auditorium Kampus',
      0,
      'APPROVED',
      'Fasilitas proyektor dan lighting telah disiapkan.',
      'Kegiatan positif universitas. Disetujui penuh.',
      staffChecklist3,
      headChecklist3,
      null,
      '2026-09-06 11:00:00',
      'Rizky Pratama, S.T.',
      '2026-09-06 14:30:00',
      'Dr. Ir. Hendra Wijaya, M.T.',
      '2026-09-05 13:10:00'
    );
  }

  // Check sample maintenance records
  const mntCount = db.prepare('SELECT COUNT(*) as cnt FROM maintenance_records').get() as { cnt: number };
  if (mntCount.cnt === 0) {
    const insertMnt = db.prepare(`
      INSERT OR IGNORE INTO maintenance_records (
        id, ticket_number, asset_id, type, category, title, description,
        technician_name, scheduled_date, completed_date, cost, status, action_taken, spare_parts, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Pemeliharaan Mesin Bubut (Sedang Dikerjakan)
    insertMnt.run(
      'mnt_1',
      'MNT-2026-0001',
      'ast_msn_1',
      'CORRECTIVE',
      'MACHINERY',
      'Perbaikan Penggantian V-Belt & Kalibrasi Spindle Mesin Bubut CNC',
      'Ditemukan getaran berlebih pada putaran 1500 RPM saat praktikum mahasiswa semester akhir.',
      'Pak Triyono (Teknisi Lab Mesin)',
      '2026-09-07',
      null,
      450000,
      'IN_PROGRESS',
      'Membongkar cover puli mesin, mengganti sabuk penggerak v-belt baru, penyetelan ketegangan belt.',
      'V-Belt Optibelt SPZ 950 (2 unit), Oli Pelumas Mesin Shell Tellus 68',
      '2026-09-07 08:30:00'
    );

    // 2. Pemeliharaan Rutin Genset Kampus (Dijadwalkan)
    insertMnt.run(
      'mnt_2',
      'MNT-2026-0002',
      'ast_kls_1',
      'PREVENTIVE',
      'ELECTRICAL',
      'Servis Berkala 250 Jam & Uji Beban Otomatis (Warm-up) Genset 50 kVA',
      'Pemeriksaan level oli mesin diesel, saringan solar, filter udara, dan pengujian charging aki 24V.',
      'CV. Multi Daya Mandiri (Vendor Kelistrikan)',
      '2026-09-15',
      null,
      1200000,
      'SCHEDULED',
      'Pemeriksaan komprehensif sistem pendingin radiator dan pengetesan ATS otomatis tanpa beban.',
      'Filter Oli Fleetguard LF16015, Filter Solar Cummins FS1280',
      '2026-09-08 11:15:00'
    );

    // 3. Pemeliharaan Proyektor Elektronik Pembelajaran (Selesai)
    insertMnt.run(
      'mnt_3',
      'MNT-2026-0003',
      'ast_elk_1',
      'PREVENTIVE',
      'ELECTRONIC',
      'Pembersihan Filter Udara Optik & Kalibrasi Fokus Lensa Proyektor Laser Epson',
      'Perawatan rutin per 6 bulan untuk menjamin ketajaman visual dan mencegah panas berlebih pada lampu laser.',
      'Agus Wahyudi (Staff Perawatan Elektronik)',
      '2026-09-02',
      '2026-09-02',
      150000,
      'COMPLETED',
      'Pembersihan kisi-kisi pendingin filter debu dengan blower anti-statis, tes warna RGB 100% normal.',
      'Filter Busa Spons Epson ELPAF56',
      '2026-09-01 14:00:00'
    );
  }
}

export const db = getDatabase();
export { hashPassword };
