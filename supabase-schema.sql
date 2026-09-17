-- Supabase schema for the Sarpras application.
-- Run this file in Supabase SQL Editor before deploying the Next.js app.

create table if not exists users (
  id text primary key,
  username text unique not null,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('ADMIN', 'STAFF_SARPRAS', 'KEPALA_SARPRAS')),
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id text primary key,
  code text unique not null,
  name text not null,
  category text not null,
  building text not null default 'Belum Ditentukan',
  room text not null default 'Belum Ditentukan',
  location text not null,
  condition text not null,
  status text not null,
  specs text,
  capacity integer not null default 0,
  purchase_year integer,
  purchase_date date,
  purchase_price numeric(14, 2) not null default 0,
  depreciation_rate numeric(6, 2) not null default 0,
  depreciation_previous numeric(14, 2) not null default 0,
  depreciation_current numeric(14, 2) not null default 0,
  book_value numeric(14, 2) not null default 0,
  funding_source text,
  created_at timestamptz not null default now()
);

alter table assets add column if not exists building text not null default 'Belum Ditentukan';
alter table assets add column if not exists room text not null default 'Belum Ditentukan';
alter table assets add column if not exists purchase_date date;
alter table assets add column if not exists purchase_price numeric(14, 2) not null default 0;
alter table assets add column if not exists depreciation_rate numeric(6, 2) not null default 0;
alter table assets add column if not exists depreciation_previous numeric(14, 2) not null default 0;
alter table assets add column if not exists depreciation_current numeric(14, 2) not null default 0;
alter table assets add column if not exists book_value numeric(14, 2) not null default 0;
alter table assets add column if not exists funding_source text;

create table if not exists loan_requests (
  id text primary key,
  ticket_code text unique not null,
  borrower_name text not null,
  borrower_id text not null,
  borrower_role text not null,
  borrower_phone text not null,
  borrower_email text,
  asset_id text references assets(id),
  room_building text,
  room_name text,
  start_date date not null,
  start_time time not null,
  end_date date not null,
  end_time time not null,
  purpose text not null,
  destination text,
  driver_needed boolean not null default false,
  attachment_url text,
  status text not null,
  staff_notes text,
  head_notes text,
  staff_checklist jsonb,
  head_checklist jsonb,
  return_checklist jsonb,
  staff_verified_at timestamptz,
  staff_verified_by text,
  head_approved_at timestamptz,
  head_approved_by text,
  picked_up_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table loan_requests alter column asset_id drop not null;
alter table loan_requests add column if not exists room_building text;
alter table loan_requests add column if not exists room_name text;

create table if not exists maintenance_records (
  id text primary key,
  ticket_number text unique not null,
  asset_id text not null references assets(id),
  type text not null,
  category text not null,
  title text not null,
  description text,
  technician_name text,
  scheduled_date date not null,
  completed_date date,
  cost integer not null default 0,
  status text not null,
  action_taken text,
  spare_parts text,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_category_status on assets(category, status);
create index if not exists idx_assets_building_room on assets(building, room);
create index if not exists idx_loans_status_created on loan_requests(status, created_at desc);
create index if not exists idx_loans_asset_dates on loan_requests(asset_id, start_date, end_date);
create index if not exists idx_loans_room_dates on loan_requests(room_building, room_name, start_date, end_date);
create index if not exists idx_maintenance_status_date on maintenance_records(status, scheduled_date);

insert into users (id, username, password_hash, name, role)
values
  ('usr_admin', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrator Sarpras', 'ADMIN'),
  ('usr_staff', 'staff', '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6', 'Rizky Pratama, S.T. (Staff Sarpras)', 'STAFF_SARPRAS'),
  ('usr_kepala', 'kepala', '2da37a54c319f44b57f2f7fbf6b8feb854f60dcfa87d9671cf185e4dc19e9e07', 'Dr. Ir. Hendra Wijaya, M.T. (Kepala Bagian Sarpras)', 'KEPALA_SARPRAS')
on conflict (id) do nothing;

insert into assets (id, code, name, category, location, condition, status, specs, capacity, purchase_year)
values
  ('ast_car_1', 'MOB-001', 'Toyota HiAce Commuter Kampus (B 1234 KMP)', 'VEHICLE', 'Pool Kendaraan Rektorat', 'BAIK', 'TERSEDIA', 'Diesel 2.500cc, Kapasitas 16 Kursi Penumpang, Full AC, Audio & Mic, Layak Operasi Luar Kota', 16, 2022),
  ('ast_car_2', 'MOB-002', 'Toyota Kijang Innova Reborn 2.4 G (B 5678 SAR)', 'VEHICLE', 'Pool Kendaraan Rektorat', 'BAIK', 'TERSEDIA', 'Diesel Matic, Kapasitas 7 Penumpang, AC Double Blower, Mobil Dinas & Operasional Pimpinan/Dosen', 7, 2023),
  ('ast_car_3', 'MOB-003', 'Bus Kampus Isuzu NQR 71 (B 9012 UNI)', 'VEHICLE', 'Pool Kendaraan Rektorat', 'BAIK', 'TERSEDIA', 'Kapasitas 29 Kursi, Bagasi Luas, Sound System, Khusus Kegiatan Rombongan Mahasiswa / Ormawa', 29, 2021),
  ('ast_room_1', 'RNG-101', 'Ruang Kuliah Teater Graha Utama (A-201)', 'ROOM', 'Gedung Kuliah Bersama Lt. 2', 'BAIK', 'TERSEDIA', 'Kapasitas 80 Mahasiswa, Meja Lipat Kursi Kuliah, Proyektor Dual Screen, 2 AC Standing 5 PK, Sound System Wireless', 80, 2020),
  ('ast_room_2', 'RNG-102', 'Laboratorium Komputer Multimedia (B-102)', 'ROOM', 'Gedung Sains & Teknologi Lt. 1', 'BAIK', 'TERSEDIA', '40 Unit PC Core i7 RAM 16GB RTX 3060, Layar 24 inch, LAN Gigabit, Smart TV 75 inch, 3 AC Split 2 PK', 40, 2023),
  ('ast_room_3', 'RNG-103', 'Auditorium Serbaguna Kampus', 'ROOM', 'Gedung Student Center Lt. 3', 'BAIK', 'TERSEDIA', 'Kapasitas 500 Orang, Panggung Utama, Lighting Rig, Mixer Audio 32 Channel, VIP Room, 6 AC Central', 500, 2019),
  ('ast_elk_1', 'ELK-001', 'Proyektor Laser Epson EB-L520U 5200 Lumens', 'ELECTRONIC', 'Gudang Sarpras Elektronik Lt. 1', 'BAIK', 'TERSEDIA', 'Resolusi WUXGA Full HD, HDMI x2, Wireless Display, Sangat Terang untuk Presentasi Aula/Kelas Besar', 1, 2023),
  ('ast_elk_2', 'ELK-002', 'Smart Interactive Whiteboard Promethean 75 inch', 'ELECTRONIC', 'Lab Microteaching Gedung C', 'BAIK', 'TERSEDIA', '4K UHD Touchscreen, OS Android & Windows OPS, Stylus Pen Dual, Kamera Konferensi 4K', 1, 2024),
  ('ast_msn_1', 'MSN-001', 'Mesin Bubut CNC Mini Benchtop CQ6128', 'MACHINERY', 'Workshop Teknik Mesin Gedung Lab Terpadu', 'BAIK', 'DALAM_PERAWATAN', 'Motor 1.5 kW, Panjang Kerja 750mm, Swing over bed 280mm, Untuk Praktikum Mahasiswa', 1, 2022),
  ('ast_kls_1', 'KLS-001', 'Genset Silent Diesel 50 kVA Cummins Power', 'ELECTRICAL', 'Rumah Daya & Kelistrikan Barat', 'BAIK', 'TERSEDIA', 'Output 40 kW / 50 kVA, 3 Phase 380V/220V, Panel ATS Otomatis, Backup Utama Gedung Rektorat & Server', 1, 2021),
  ('ast_kls_2', 'KLS-002', 'Panel Distribusi Listrik Utama (LVMDP) Gedung Sains', 'ELECTRICAL', 'Ruang Panel Lt. Basement Gedung B', 'BAIK', 'TERSEDIA', 'MCCB 630A Schneider, Kapasitor Bank 150 kVAR, Pengecekan Rutin Suhu Busbar', 1, 2020)
on conflict (id) do nothing;

insert into loan_requests (id, ticket_code, borrower_name, borrower_id, borrower_role, borrower_phone, borrower_email, asset_id, start_date, start_time, end_date, end_time, purpose, destination, driver_needed, status, staff_notes, staff_checklist, staff_verified_at, staff_verified_by, created_at)
values
  ('loan_sample_1', 'SARPRAS-2026-0001', 'Dimas Arya Wardhana', '22051204055', 'Ormawa/UKM', '081234567890', 'dimas.arya@mhs.ac.id', 'ast_car_1', '2026-09-12', '07:00', '2026-09-13', '21:00', 'Kegiatan Pengabdian Masyarakat & Bakti Sosial BEM Fakultas di Desa Binaan Sukamaju', 'Kec. Sukamaju, Kab. Bogor', true, 'PENDING_STAFF', null, null, null, null, '2026-09-08 09:30:00+07'),
  ('loan_sample_2', 'SARPRAS-2026-0002', 'Dr. Budi Santoso, M.Kom.', '198503152010121002', 'Dosen', '081398765432', 'budi.santoso@dosen.ac.id', 'ast_car_2', '2026-09-15', '08:00', '2026-09-15', '18:00', 'Perjalanan Dinas Menghadiri Seminar Internasional AI & Teknologi Pendidikan di Hotel Grand Horison', 'Pusat Konvensi Horison, Jakarta Pusat', true, 'PENDING_HEAD', 'Checklist staff lengkap. Jadwal armada kosong dan siap ditugaskan.', '{"unit_available":true,"physical_condition_ok":true,"fuel_or_key_ready":true,"documents_complete":true,"notes":"Unit Innova dalam kondisi bersih, oli dan bensin terisi. Surat tugas dosen terlampir lengkap."}', '2026-09-08 10:45:00+07', 'Rizky Pratama, S.T.', '2026-09-07 15:20:00+07'),
  ('loan_sample_3', 'SARPRAS-2026-0003', 'Anisa Fitriani', '210411100088', 'Ormawa/UKM', '085711223344', 'himpunan.it@mhs.ac.id', 'ast_room_3', '2026-09-20', '08:00', '2026-09-20', '17:00', 'Seminar Nasional Teknologi Informasi & Expo Startup Mahasiswa 2026', 'Auditorium Kampus', false, 'APPROVED', 'Fasilitas proyektor dan lighting telah disiapkan.', '{"unit_available":true,"physical_condition_ok":true,"fuel_or_key_ready":true,"documents_complete":true,"notes":"Ruang Aula bebas dari agenda lain, soundman dan teknisi AC sudah dijadwalkan standby."}', '2026-09-06 11:00:00+07', 'Rizky Pratama, S.T.', '2026-09-05 13:10:00+07')
on conflict (id) do nothing;

insert into maintenance_records (id, ticket_number, asset_id, type, category, title, description, technician_name, scheduled_date, completed_date, cost, status, action_taken, spare_parts, created_at)
values
  ('mnt_1', 'MNT-2026-0001', 'ast_msn_1', 'CORRECTIVE', 'MACHINERY', 'Perbaikan Penggantian V-Belt & Kalibrasi Spindle Mesin Bubut CNC', 'Ditemukan getaran berlebih pada putaran 1500 RPM saat praktikum mahasiswa semester akhir.', 'Pak Triyono (Teknisi Lab Mesin)', '2026-09-07', null, 450000, 'IN_PROGRESS', 'Membongkar cover puli mesin, mengganti sabuk penggerak v-belt baru, penyetelan ketegangan belt.', 'V-Belt Optibelt SPZ 950 (2 unit), Oli Pelumas Mesin Shell Tellus 68', '2026-09-07 08:30:00+07'),
  ('mnt_2', 'MNT-2026-0002', 'ast_kls_1', 'PREVENTIVE', 'ELECTRICAL', 'Servis Berkala 250 Jam & Uji Beban Otomatis (Warm-up) Genset 50 kVA', 'Pemeriksaan level oli mesin diesel, saringan solar, filter udara, dan pengujian charging aki 24V.', 'CV. Multi Daya Mandiri (Vendor Kelistrikan)', '2026-09-15', null, 1200000, 'SCHEDULED', 'Pemeriksaan komprehensif sistem pendingin radiator dan pengetesan ATS otomatis tanpa beban.', 'Filter Oli Fleetguard LF16015, Filter Solar Cummins FS1280', '2026-09-08 11:15:00+07'),
  ('mnt_3', 'MNT-2026-0003', 'ast_elk_1', 'PREVENTIVE', 'ELECTRONIC', 'Pembersihan Filter Udara Optik & Kalibrasi Fokus Lensa Proyektor Laser Epson', 'Perawatan rutin per 6 bulan untuk menjamin ketajaman visual dan mencegah panas berlebih pada lampu laser.', 'Agus Wahyudi (Staff Perawatan Elektronik)', '2026-09-02', '2026-09-02', 150000, 'COMPLETED', 'Pembersihan kisi-kisi pendingin filter debu dengan blower anti-statis, tes warna RGB 100% normal.', 'Filter Busa Spons Epson ELPAF56', '2026-09-01 14:00:00+07')
on conflict (id) do nothing;

-- This project uses its own cookie authentication. Keep the service role key server-side only.
-- Change these demo passwords before production deployment.
