import fs from 'fs';
import path from 'path';

// Data inventaris lengkap diekstrak dari dokumen resmi
// "DAFTAR INVENTARIS RUANGAN SARANA PRASARANA UNIVERSITAS BHAMADA SLAWI T.A 2025/2026"
// Halaman 2 s/d 80

export const inventoryPages = [
  // Page 2: Gedung D1, D1.1 / R.MULTIMEDIA
  {
    building: 'D1', room: 'D1.1 / R.MULTIMEDIA', area: '80 m2',
    items: [
      { no: 1, code: '20.01.06.0001.D1.1.01.20', name: 'Meja Komputer Multi Partisi', qty: 3, specs: 'Papan Serat / MDF', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 2, code: '20.01.16.0001.D1.1.01.15', name: 'Meja Baca Kayu Polisture', qty: 4, specs: 'Kayu polisture', year: 2015, cond: 'Baik', source: 'YPTSH' },
      { no: 3, code: '20.01.05.0001.D1.1.01.10', name: 'Meja Komputer kayu Polisture', qty: 2, specs: 'Kayu polisture', year: 2010, cond: 'Baik', source: 'YPTSH' },
      { no: 4, code: '20.04.10.0001.D1.1.01.19', name: 'Kursi Tumpuk', qty: 14, specs: 'Besi Stenlis', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 5, code: '20.03.01.0001.D1.1.01.21', name: 'Rak Partisi', qty: 1, specs: 'Papan Serat / MDF', year: 2021, cond: 'Baik', source: 'YPTSH' },
      { no: 6, code: '20.01.07.0001.D1.1.01.21', name: 'Meja Komputer Partisi', qty: 5, specs: 'Papan Serat / MDF', year: 2021, cond: 'Baik', source: 'YPTSH' },
      { no: 7, code: '21.02.02.0001.D1.4.01.21', name: 'LCD Proyektor', qty: 1, specs: 'Plat dan Komponen', year: 2021, cond: 'Baik', source: 'YPTSH' },
      { no: 8, code: '21.02.07.0001.D1.1.01.20', name: 'Tripod LCD Proyektor', qty: 1, specs: 'Pipa Besi', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 9, code: '21.02.03.0001.D1.1.01.19', name: 'AC Daikin 2 pk', qty: 1, specs: 'Plat Besi', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 10, code: '21.02.03.0001.D1.1.01.20', name: 'Panasonic 2 pk', qty: 1, specs: 'Plat Besi', year: 2020, cond: 'Baik', source: 'YPTSH' }
    ]
  },
  // Page 3: Gedung D1, D1.2 / PRODI S1 KEPERAWATAN
  {
    building: 'D1', room: 'D1.2 / PRODI S1 KEPERAWATAN', area: '80 m2',
    items: [
      { no: 1, code: '20.01.01.0001.D1.2.01.20', name: 'Meja Komputer Partisi', qty: 3, specs: 'Papan Serat / MDF', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 2, code: '20.01.01.0001.D1.2.01.20_2', name: 'Meja 1/2 Biro Polisture', qty: 10, specs: 'Kayu Polisture', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 3, code: '20.02.15.0001.D1.2.01.20', name: 'Meja Meeting kayu', qty: 1, specs: 'Kayu Polisture', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 4, code: '20.04.10.0001.D1.2.01.20', name: 'Kursi Tumpuk', qty: 14, specs: 'Besi Stenlis', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 5, code: '20.04.08.0001.D1.2.01.19', name: 'Kursi Putar Kecil', qty: 5, specs: 'Besi Stenlis', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 6, code: '20.02.15.0001.D1.2.01.20_2', name: 'Bufet Kecil', qty: 1, specs: 'Papan Serat / MDF', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 7, code: '20.02.08.0001.D1.2.01.20', name: 'Alamari Kaca Kecil', qty: 1, specs: 'Kaca Almunium', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 8, code: '20.04.11.0001.D1.2.01.19', name: 'Kursi Sofa', qty: 1, specs: 'Kayu Polisture', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 9, code: '21.05.02.0001.D1.2.01.19', name: 'Almari Pendingin', qty: 1, specs: 'Plat Besi', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 10, code: '21.02.03.0001.D1.1.01.19_D12', name: 'AC Daikin 2 Pk', qty: 1, specs: 'Plat Besi', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 11, code: '21.02.03.0001.D1.1.01.16', name: 'AC Panalia', qty: 1, specs: 'Plat Besi', year: 2016, cond: 'Baik', source: 'YPTSH' }
    ]
  },
  // Page 4: Gedung D1, D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)
  {
    building: 'D1', room: 'D1.3 / PRODI KESELAMATAN DAN KESEHATAN KERJA (K3)', area: '80 m2',
    items: [
      { no: 1, code: '01.01.09.0001.D1.3.01.10', name: 'Meja Komputer Partisi', qty: 3, specs: 'Papan Serat / MDF', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 2, code: '20.01.01.0001.D1.3.01.17', name: 'Meja 1/2 Biro Kayu', qty: 6, specs: 'Kayu Polisture', year: 2017, cond: 'Baik', source: 'YPTSH' },
      { no: 3, code: '20.01.08.0001.D1.3.01.19', name: 'Meja Panjang Polisture', qty: 1, specs: 'Kayu Polisture', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 4, code: '20.02.13.0001.D1.3.01.18', name: 'Bufet Partisi', qty: 1, specs: 'Papan Serat / MDF', year: 2018, cond: 'Baik', source: 'YPTSH' },
      { no: 5, code: '20.02.13.0001.D1.3.01.19', name: 'Almari Bufet Kayu', qty: 1, specs: 'Kayu Polisture', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 6, code: '20.04.10.0001.D1.3.01.19', name: 'Kursi Tumpuk', qty: 12, specs: 'Besi Stenlis', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 7, code: '24.02.02.0001.D1.3.01.20', name: 'CPU Komputer', qty: 1, specs: 'Plat BESI', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 8, code: '24.02.07.0001.D1.3.01.20', name: 'Monitor Komputer', qty: 1, specs: 'Plastik mica', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 9, code: '24.02.04.0001.D1.3.01.20', name: 'Keyboard', qty: 1, specs: 'Plastik mica', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 10, code: '21.07.03.0001.D1.3.01.22', name: 'Printer Epson L3110', qty: 1, specs: 'Plastik mica', year: 2022, cond: 'Baik', source: 'YPTSH' },
      { no: 11, code: '21.02.03.0001.D1.1.01.19_D13', name: 'AC Daikin 2 Pk', qty: 1, specs: 'Plat Besi', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 12, code: '21.02.03.0001.D1.1.01.16_D13', name: 'AC Panalia', qty: 1, specs: 'Plat Besi', year: 2016, cond: 'Baik', source: 'YPTSH' }
    ]
  },
  // Page 5: Gedung D1, D1.4 / Prodi DIII Keperawatan
  {
    building: 'D1', room: 'D1.4 / Prodi DIII Keperawatan', area: '80 m2',
    items: [
      { no: 1, code: '20.01.01.0001.D1.4.01.14', name: 'Meja 1/2 biro Partisi', qty: 8, specs: 'Papan Serat / MDF', year: 2014, cond: 'Baik', source: 'YPTSH' },
      { no: 2, code: '20.01.05.0001.D1.4.01.10', name: 'Meja Komputer Polisture', qty: 4, specs: 'Kayu Polisture', year: 2010, cond: 'Baik', source: 'YPTSH' },
      { no: 3, code: '20.04.02.0001.D1.4.01.20', name: 'Kursi Tumpuk', qty: 12, specs: 'Besi Stenlis', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 4, code: '20.03.02.0001.D1.4.01.20', name: 'Rak Buku Partisi kecil', qty: 4, specs: 'Papan Serat / MDF', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 5, code: '20.04.11.0001.D1.2.01.19_D14', name: 'Almari kayu', qty: 1, specs: 'Kayu polisture', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 6, code: '21.03.02.0001.D1.4.01.17', name: 'AC Panasonic 1 Pk', qty: 1, specs: 'Plat Besi', year: 2017, cond: 'Baik', source: 'YPTSH' },
      { no: 7, code: '21.03.02.0001.D1.4.01.20', name: 'Daikin 2 PK', qty: 1, specs: 'Plat Besi', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 8, code: '20.05.01.0001.D1.4.01.15', name: 'Papan Whiteboard', qty: 1, specs: 'Kayu Polisture', year: 2015, cond: 'Baik', source: 'YPTSH' },
      { no: 9, code: '21.01.02.0001.D1.4.01.11', name: 'Box Speaker Kecil', qty: 1, specs: 'Plat Besi', year: 2011, cond: 'Baik', source: 'YPTSH' }
    ]
  },
  // Page 6: Gedung D1, D1.5 / Kelas Perkuliahan
  {
    building: 'D1', room: 'D1.5 / Kelas Perkuliahan', area: '80 m2',
    items: [
      { no: 1, code: '20.01.01.0001.D1.4.01.14_D15', name: 'Meja 1/2 biro Polisture', qty: 1, specs: 'Papan Kayu jati', year: 2014, cond: 'Baik', source: 'YPTSH' },
      { no: 2, code: '20.04.02.0001.D1.4.01.15', name: 'Kursi Lipat Biasa Stanlis', qty: 1, specs: 'Pipa Stenlis', year: 2015, cond: 'Baik', source: 'YPTSH' },
      { no: 3, code: '20.04.01.0001.D1.4.01.19', name: 'Kursi Kuliah Stenlis', qty: 55, specs: 'Pipa Stenlis', year: 2019, cond: 'Baik', source: 'YPTSH' },
      { no: 4, code: '20.03.10.0001.D1.4.01.23', name: 'Rak Ampli Partisi', qty: 1, specs: 'Papan Serat / MDF', year: 2023, cond: 'Baik', source: 'YPTSH' },
      { no: 5, code: '21.01.06.0001.D1.4.01.11', name: 'Amplifier', qty: 1, specs: 'Plat Besi', year: 2011, cond: 'Baik', source: 'YPTSH' },
      { no: 6, code: '21.01.13.0001.D1.4.01.23', name: 'Micropone wereles', qty: 1, specs: 'Plastik', year: 2023, cond: 'Baik', source: 'YPTSH' },
      { no: 7, code: '21.02.02.0001.D1.4.01.21_D15', name: 'LCD Projektor', qty: 1, specs: 'Besi Plat', year: 2021, cond: 'Baik', source: 'YPTSH' },
      { no: 8, code: '21.02.07.0001.D2.1.01.12_D15', name: 'Breket LCD Projektor', qty: 1, specs: 'Besi Pipa', year: 2012, cond: 'Baik', source: 'YPTSH' },
      { no: 9, code: '21.03.02.0001.D1.4.01.17_D15', name: 'AC Panasonic 1 Pk', qty: 1, specs: 'Plat Besi', year: 2017, cond: 'Baik', source: 'YPTSH' },
      { no: 10, code: '21.03.02.0001.D1.4.01.20_D15', name: 'Daikin 2 PK', qty: 1, specs: 'Plat Besi', year: 2020, cond: 'Baik', source: 'YPTSH' },
      { no: 11, code: '20.05.01.0001.D1.4.01.15_D15', name: 'Papan Whiteboard', qty: 1, specs: 'Plastik', year: 2015, cond: 'Baik', source: 'YPTSH' },
      { no: 12, code: '21.01.02.0001.D1.4.01.11_D15', name: 'Box Speaker Kecil', qty: 1, specs: 'Plat Besi', year: 2011, cond: 'Baik', source: 'YPTSH' }
    ]
  }
];

