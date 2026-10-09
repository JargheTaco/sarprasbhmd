-- Import inventaris ruangan D1.1-D1.5 dan D2.1-D2.5.
-- Jalankan seluruh file sekaligus di Supabase SQL Editor setelah supabase-schema.sql.
-- Baris dengan kode berulang di file ini atau yang sudah ada di assets akan dilewati.
-- Hasil query terakhir menampilkan jumlah berhasil dan rincian baris yang dilewati.

begin;

-- Tambahkan kolom ini untuk kompatibilitas dengan tabel assets versi lama.
alter table assets
  add column if not exists asset_type text not null default 'INVENTARIS';

create temporary table _kir_import_d1_d2 (
  source_no integer not null,
  code text not null,
  name text not null,
  category text not null,
  quantity integer not null,
  specs text,
  purchase_year integer,
  condition text,
  building text not null,
  room text not null
) on commit drop;

insert into _kir_import_d1_d2
  (source_no, code, name, category, quantity, specs, purchase_year, condition, building, room)
values
  (1, '20.01.06.0001.D1.1.01.20', 'Meja Komputer Multi Partisi', 'FURNITURE', 3, 'Papan Serat / MDF', 2020, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (2, '20.01.16.0001.D1.1.01.15', 'Meja Baca Kayu Polisture', 'FURNITURE', 4, 'Kayu polisture', 2015, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (3, '20.01.05.0001.D1.1.01.10', 'Meja Komputer kayu Polisture', 'FURNITURE', 2, 'Kayu polisture', 2010, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (4, '20.04.10.0001.D1.1.01.19', 'Kursi Tumpuk', 'FURNITURE', 14, 'Besi Stenlis', 2019, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (5, '20.03.01.0001.D1.1.01.21', 'Rak Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2021, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (6, '20.01.07.0001.D1.1.01.21', 'Meja Komputer Partisi', 'FURNITURE', 5, 'Papan Serat / MDF', 2021, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (7, '21.02.02.0001.D1.4.01.21', 'LCD Proyektor', 'ELECTRONIC', 1, 'Plat dan Komponen', 2021, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (8, '21.02.07.0001.D1.1.01.20', 'Tripod LCD Proyektor', 'ELECTRONIC', 1, 'Pipa Besi', 2020, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (9, '21.02.03.0001.D1.1.01.19', 'AC Daikin 2 pk', 'ELECTRONIC', 1, 'Plat Besi', 2019, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),
  (10, '21.02.03.0001.D1.1.01.20', 'Panasonic 2 pk', 'ELECTRONIC', 1, 'Palt Besi', 2020, 'BAIK', 'D1', 'D1.1 / R.MULTIMEDIA'),

  (1, '20.01.01.0001.D1.2.01.20', 'Meja Komputer Partisi', 'FURNITURE', 3, 'Papan Serat / MDF', 2020, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (2, '20.01.01.0001.D1.2.01.20', 'Meja 1/2 Biro Polisture', 'FURNITURE', 10, 'Kayu Polissture', 2020, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (3, '20.02.15.0001.D1.2.01.20', 'Meja Meeting kayu', 'FURNITURE', 1, 'Kayu Polisture', 2020, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (4, '20.04.10.0001.D1.2.01.20', 'Kursi Tumpuk', 'FURNITURE', 14, 'Besi Stenlis', 2020, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (5, '20.04.08.0001.D1.2.01.19', 'Kursi Putar Kecil', 'FURNITURE', 5, 'Besi Stenlis', 2019, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (6, '20.02.15.0001.D1.2.01.20', 'Bufet Kecil', 'FURNITURE', 1, 'Papan Serat / MDF', 2020, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (7, '20.02.08.0001.D1.2.01.20', 'Alamari Kaca Kecil', 'FURNITURE', 1, 'Kaca Almunium', 2020, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (8, '20.04.11.0001.D1.2.01.19', 'Kursi Sofa', 'FURNITURE', 1, 'Kayu Polissture', 2019, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (9, '21.05.02.0001.D1.2.01.19', 'Almari Pendingin', 'ELECTRONIC', 1, 'Plat Besi', 2019, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (10, '21.02.03.0001.D1.1.01.19', 'AC Daikin 2 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2019, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),
  (11, '21.02.03.0001.D1.1.01.16', 'AC Panalia', 'ELECTRONIC', 1, 'Plat Besi', 2016, 'BAIK', 'D1', 'D1.2 / PRODI S1 KEPERAWATAN'),

  (1, '01.01.09.0001.D1,3.01.10', 'Meja Komputer Partisi', 'FURNITURE', 3, 'Papan Serat / MDF', 2020, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (2, '20.01.01.0001.D1.3.01.17', 'Meja 1/2 Biro Kayu', 'FURNITURE', 6, 'Kayu Polissture', 2017, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (3, '20.01.08.0001.D1,3.01.19', 'Meja Panjang Polisture', 'FURNITURE', 1, 'Kayu Polisture', 2019, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (4, '20.02.13.0001.D1,3.01.18', 'Bufet Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2018, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (5, '20.02.13.0001.D1.3.01.19', 'Almari Bufet Kayu', 'FURNITURE', 1, 'Kayu Polisture', 2019, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (6, '20.04.10.0001.D1.3.01.19', 'Kursi Tumpuk', 'FURNITURE', 12, 'Besi Stenlis', 2019, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (7, '24.02.02.0001.D1.3.01.20', 'CPU Komputer', 'ELECTRONIC', 1, 'Plat BESI', 2020, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (8, '24.02.07.0001.D1.3.01.20', 'Monitor Komputer', 'ELECTRONIC', 1, 'Plastik mica', 2020, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (9, '24.02.04.0001.D1.3.01.20', 'Keyboard', 'ELECTRONIC', 1, 'Plastik mica', 2020, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (10, '21.07.03.0001.D1.3.01.22', 'Printer Epson L3110', 'ELECTRONIC', 1, 'Plastik mica', 2022, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (11, '21.02.03.0001.D1.1.01.19', 'AC Daikin 2 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2019, 'BAIK', 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),
  (12, '21.02.03.0001.D1.1.01.16', 'AC Panalia', 'ELECTRONIC', 1, 'Plat Besi', 2016, null, 'D1', 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)'),

  (1, '20.01.01.0001.D1.4.01.14', 'Meja 1/2 biro Partisis', 'FURNITURE', 8, 'Papan Serat / MDF', 2014, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (2, '20.01.05.0001.D1.4.01.10', 'Meja Komputer Polisture', 'FURNITURE', 4, 'Kayu Polisture', 2010, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (3, '20.04.02.0001.D1.4.01.20', 'Kursi Tumpuk', 'FURNITURE', 12, 'Besi Stenlis', 2020, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (4, '20.03.02.0001.D1.4.01.20', 'Rak Buku Partisi kecil', 'FURNITURE', 4, 'Papan Serat / MDF', 2020, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (5, '20.04.11.0001.D1.2.01.19', 'Almari kayu', 'FURNITURE', 1, 'Kayu polisture', 2019, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (6, '21.03.02.0001.D1.4.01.17', 'AC Panasonic 1 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2017, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (7, '21.03.02.0001.D1.4.01.20', 'Daikin 2 PK', 'ELECTRONIC', 1, 'Plat Besi', 2020, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (8, '20.05.01.0001.D1.4.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Kayu Polisture', 2015, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),
  (9, '21.01.02.0001.D1.4.01.11', 'Box Speaker Kecil', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D1', 'D1.4 / PRODI DIII KEPERAWATAN'),

  (1, '20.01.01.0001.D1.4.01.14', 'Meja 1/2 biro Polisture', 'FURNITURE', 1, 'Papan Kayu jati', 2014, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (2, '20.04.02.0001.D1.4.01.15', 'Kursi Lipat Biasa Stanlis', 'FURNITURE', 1, 'Pipa Stenlis', 2015, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (3, '20.04.01.0001.D1.4.01.19', 'Kursi Kuliah Stenlis', 'FURNITURE', 55, 'Pipa Stenlis', 2019, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (4, '20.03.10.0001.D1.4.01.23', 'Rak Ampli Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2023, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (5, '21.01.06.0001.D1.4.01.11', 'Amplifier', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (6, '21.01.13.0001.D1.4.01.23', 'Micropone wereles', 'ELECTRONIC', 1, 'Plastik', 2023, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (7, '21.02.02.0001.D1.4.01.21', 'LCD Projektor', 'ELECTRONIC', 1, 'Besi Plat', 2021, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (8, '21.02.07.0001.D2.1.01.12', 'Breket LCD Projektor', 'ELECTRONIC', 1, 'Besi Pipa', 2012, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (9, '21.03.02.0001.D1.4.01.17', 'AC Panasonic 1 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2017, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (10, '21.03.02.0001.D1.4.01.20', 'Daikin 2 PK', 'ELECTRONIC', 1, 'Plat Besi', 2020, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (11, '20.05.01.0001.D1.4.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Plastik', 2015, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),
  (12, '21.01.02.0001.D1.4.01.11', 'Box Speaker Kecil', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D1', 'D1.5 / KELAS PERKULIAHAN'),

  (1, '20.01.01.0001.D2.1.01.14', 'Meja Kayu 1/2 biro Polisture', 'FURNITURE', 1, 'Kayu Jati', 2014, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (2, '20.04.01.0001.D2.1.01.18', 'Kursi Kuliah Stenlis', 'FURNITURE', 55, 'Pipa Stenlis', 2018, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (3, '20.04.02.0001.D2.1.01.15', 'Kursi Lipat Stenlis', 'FURNITURE', 1, 'Pipa Stenlis', 2015, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (4, '21.01.06.0001.D2.1.01.11', 'Amplifier', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (5, '20.03.10.0001.D2.1.01.23', 'Rak Ampli Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2023, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (6, '21.01.02.0001.D2.1.01.11', 'Box Speaker', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (7, '21.02.02.0001.D2.1.01.21', 'LCD Projektor', 'ELECTRONIC', 1, 'Plat Besi', 2021, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (8, '21.02.07.0001.D2.1.01.12', 'Breket LCD Projektor', 'ELECTRONIC', 1, 'Pipa Besi', 2012, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (9, '21.01.13.0001.D2.1.01.18', 'Micrpone', 'ELECTRONIC', 1, 'Pipa Besi', 2018, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (10, '21.03.02.0001.D2.1.01.20', 'AC Daikin 2 pk', 'ELECTRONIC', 1, 'Plat Besi', 2020, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (11, '21.03.02.0001.D2.1.01.17', 'Panasonic 1 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2017, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),
  (12, '20.05.01.0001.D1.4.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Kayu Whiteboard', 2015, 'BAIK', 'D2', 'D2.1 / KELAS PERKULIAHAN'),

  (1, '20.01.01.0001.D2.2.01.14', 'Meja Kayu 1/2 biro Polisture', 'FURNITURE', 1, 'Kayu Jati', 2014, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (2, '20.04.01.0001.D2.2.01.18', 'Kursi Kuliah Stenlis', 'FURNITURE', 55, 'Pipa Stenlis', 2018, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (3, '20.04.02.0001.D2.2.01.15', 'Kursi Lipat Stenlis', 'FURNITURE', 1, 'Pipa Stenlis', 2015, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (4, '21.01.06.0001.D2.2.01.11', 'Amplifier', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (5, '20.03.10.0001.D2.2.01.23', 'Rak Ampli Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2023, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (6, '21.01.02.0001.D2.2.01.11', 'Box Speaker', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (7, '21.02.02.0001.D2.2.01.21', 'LCD Projektor', 'ELECTRONIC', 1, 'Plat Besi', 2021, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (8, '21.02.07.0001.D2.2.01.15', 'Breket LCD Projektor', 'ELECTRONIC', 1, 'Pipa Besi', 2015, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (9, '21.01.13.0001.D2.2.01.18', 'Micrpone', 'ELECTRONIC', 1, 'Pipa Besi', 2018, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (10, '21.03.02.0001.D2.2.01.20', 'AC Daikin 2 pk', 'ELECTRONIC', 1, 'Plat Besi', 2020, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (11, '21.03.02.0001.D2.2.01.15', 'Panasonic 1 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2015, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),
  (12, '20.05.01.0001.D2.2.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Kayu Whiteboard', 2015, 'BAIK', 'D2', 'D2.2 / KELAS PERKULIAHAN'),

  (1, '20.01.01.0001.D2.1.01.14', 'Meja Kayu 1/2 biro Polisture', 'FURNITURE', 1, 'Kayu Jati', 2014, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (2, '20.04.01.0001.D2.1.01.18', 'Kursi Kuliah Stenlis', 'FURNITURE', 55, 'Pipa Stenlis', 2018, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (3, '20.04.02.0001.D2.1.01.15', 'Kursi Lipat Stenlis', 'FURNITURE', 1, 'Pipa Stenlis', 2015, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (4, '21.01.05.0001.D2.1.01.11', 'Sound Box', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (5, '20.03.05.0001.D2.1.01.23', 'Rak Ampli Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2023, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (6, '21.01.02.0001.D2.1.01.12', 'Box Speaker', 'ELECTRONIC', 1, 'Plat Besi', 2012, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (7, '21.02.02.0001.D2.1.01.21', 'LCD Projektor', 'ELECTRONIC', 1, 'Plat Besi', 2021, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (8, '21.02.07.0001.D2.1.01.15', 'Breket LCD Projektor', 'ELECTRONIC', 1, 'Pipa Besi', 2015, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (9, '21.01.13.0001.D2.1.01.18', 'Micrpone', 'ELECTRONIC', 1, 'Pipa Besi', 2018, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (10, '21.03.02.0001.D2.1.01.20', 'AC Daikin 2 pk', 'ELECTRONIC', 1, 'Palt Besi', 2020, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (11, '21.03.02.0001.D2.1.01.15', 'Panasonic 1 Pk', 'ELECTRONIC', 1, 'Palt Besi', 2015, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),
  (12, '20.05.01.0001.D1.4.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Papan Whiteboard', 2015, 'BAIK', 'D2', 'D2.3 / KELAS PERKULIAHAN'),

  (1, '20.01.01.0001.D2.4.01.14', 'Meja Kayu 1/2 biro Polisture', 'FURNITURE', 1, 'Kayu Jati', 2014, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (2, '20.04.01.0001.D2.4.01.18', 'Kursi Kuliah Stenlis', 'FURNITURE', 55, 'Pipa Stenlis', 2018, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (3, '20.04.02.0001.D2.4.01.15', 'Kursi Lipat Stenlis', 'FURNITURE', 1, 'Pipa Stenlis', 2015, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (4, '21.01.06.0001.D2.4.01.11', 'Amplifier', 'ELECTRONIC', 1, 'Plat besi', 2011, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (5, '21.01.02.0001.D2.4.01.11', 'Box Speaker', 'ELECTRONIC', 2, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (6, '21.02.02.0001.D2.4.01.21', 'LCD Projektor', 'ELECTRONIC', 1, 'Palt Besi', 2021, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (7, '21.02.07.0001.D2.4.01.15', 'Breket LCD Proyektor', 'ELECTRONIC', 1, 'Pipa Besi', 2015, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (8, '21.01.13.0001.D2.4.01.18', 'Micrpone', 'ELECTRONIC', 1, 'Pipa Besi', 2018, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (9, '21.03.02.0001.D2.4.01.20', 'AC Daikin 2 pk', 'ELECTRONIC', 1, 'Palt Besi', 2020, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (10, '21.03.02.0001.D2.4.01.15', 'Panasonic 1 Pk', 'ELECTRONIC', 1, 'Palt Besi', 2015, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (11, '20.03.10.0001.D2.4.01.23', 'Rak Kayu Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2023, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),
  (12, '20.05.01.0001.D1.4.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Papan Whiteboard', 2015, 'BAIK', 'D2', 'D2.4 / RUANG PERKULIAHAN'),

  (1, '20.01.01.0001.D2.5.01.14', 'Meja Kayu 1/2 biro Polisture', 'FURNITURE', 1, 'Kayu Jati', 2014, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (2, '20.04.01.0001.D2.5.01.18', 'Kursi Kuliah Stenlis', 'FURNITURE', 55, 'Pipa Stenlis', 2018, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (3, '20.04.02.0001.D2.5.01.15', 'Kursi Lipat Stenlis', 'FURNITURE', 1, 'Pipa Stenlis', 2015, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (4, '21.01.06.0001.D2.5.01.11', 'Amplifier', 'ELECTRONIC', 1, 'Plat besi', 2011, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (5, '21.01.02.0001.D2.5.01.11', 'Box Speaker', 'ELECTRONIC', 1, 'Plat Besi', 2011, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (6, '21.02.02.0001.D2.5.01.21', 'LCD Projektor', 'ELECTRONIC', 1, 'Plat besi', 2021, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (7, '21.02.07.0001.D2.5.01.15', 'Breket LCD Proyektor', 'ELECTRONIC', 1, 'Pipa Besi', 2015, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (8, '21.01.13.0001.D2.5.01.18', 'Micrpone', 'ELECTRONIC', 1, 'Pipa Besi', 2018, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (9, '21.03.02.0001.D2.5.01.15', 'AC Daikin 2 pk', 'ELECTRONIC', 1, 'Plat Besi', 2015, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (10, '21.03.02.0001.D2.5.01.15', 'Panasonic 1 Pk', 'ELECTRONIC', 1, 'Plat Besi', 2015, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (11, '20.03.10.0001.D2.5.01.23', 'Rak Kayu Partisi', 'FURNITURE', 1, 'Papan Serat / MDF', 2023, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN'),
  (12, '20.05.01.0001.D2.4.01.15', 'Papan Whiteboard', 'FURNITURE', 1, 'Papan Whiteboard', 2015, 'BAIK', 'D2', 'D2.5 / RUANG PERKULIAHAN');

create temporary table _kir_import_d1_d2_result (
  imported_count integer not null
) on commit drop;

create temporary table _kir_import_d1_d2_skipped on commit drop as
select
  source.*,
  case
    when counts.code_count > 1 then 'DILEWATI_KODE_GANDA_DI_FILE'
    else 'DILEWATI_KODE_SUDAH_ADA_DI_SUPABASE'
  end as reason
from _kir_import_d1_d2 as source
join (
  select code, count(*) as code_count
  from _kir_import_d1_d2
  group by code
) as counts on counts.code = source.code
where counts.code_count > 1
   or exists (select 1 from assets as existing where existing.code = source.code);

with eligible as (
  select source.*
  from _kir_import_d1_d2 as source
  where not exists (
    select 1 from _kir_import_d1_d2_skipped as skipped where skipped.code = source.code
  )
),
inserted as (
  insert into assets
    (id, code, name, category, asset_type, building, room, location, condition, status, specs, capacity, purchase_year)
  select
    'ast_kir_' || md5(eligible.code),
    eligible.code,
    eligible.name,
    eligible.category,
    'INVENTARIS',
    'Gedung ' || eligible.building,
    eligible.room,
    'Gedung ' || eligible.building || ' - ' || eligible.room,
    coalesce(eligible.condition, 'TIDAK DIKETAHUI'),
    'TERSEDIA',
    eligible.specs || '; Luas ruangan: 80 m2',
    eligible.quantity,
    eligible.purchase_year
  from eligible
  on conflict (code) do nothing
  returning code
)
insert into _kir_import_d1_d2_result (imported_count)
select count(*)::integer from inserted;

select
  'BERHASIL_DIIMPOR' as hasil,
  null::integer as nomor_baris,
  null::text as gedung,
  null::text as ruang,
  null::text as kode_inventaris,
  null::text as nama_barang,
  (select imported_count from _kir_import_d1_d2_result) as jumlah
union all
select
  skipped.reason,
  skipped.source_no,
  skipped.building,
  skipped.room,
  skipped.code,
  skipped.name,
  null::integer
from _kir_import_d1_d2_skipped as skipped
order by hasil, gedung, ruang, nomor_baris;

commit;
