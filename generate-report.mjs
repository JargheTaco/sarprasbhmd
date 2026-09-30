// generate-report.mjs
// Generates a Word document (.docx) for SIM-SARPRAS Universitas Bhamada Slawi
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  UnderlineType,
  PageBreak,
  Header,
  Footer,
  NumberFormat,
  PageNumber,
} from 'docx';
import { writeFileSync } from 'fs';

const tanggal = new Date().toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const bold = (text, size = 24) =>
  new TextRun({ text, bold: true, size, font: 'Times New Roman' });

const normal = (text, size = 24) =>
  new TextRun({ text, size, font: 'Times New Roman' });

const italic = (text, size = 24) =>
  new TextRun({ text, italics: true, size, font: 'Times New Roman' });

const para = (children, opts = {}) =>
  new Paragraph({
    children: Array.isArray(children) ? children : [children],
    spacing: { after: 160, line: 360 },
    ...opts,
  });

const heading1 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    run: { bold: true, size: 28, font: 'Times New Roman' },
  });

const heading2 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    run: { bold: true, size: 26, font: 'Times New Roman' },
  });

const heading3 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    run: { bold: true, size: 24, font: 'Times New Roman' },
  });

const emptyLine = () => new Paragraph({ text: '', spacing: { after: 80 } });

// Table helper
function makeTable(headers, rows, firstColWidth = 600) {
  const thCell = (text) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [bold(text, 22)],
          alignment: AlignmentType.CENTER,
        }),
      ],
      shading: { fill: '1E3A5F', type: ShadingType.SOLID },
    });

  const tdCell = (text, center = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [normal(text || '-', 22)],
          alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h) => thCell(h)),
      }),
      ...rows.map(
        (row, i) =>
          new TableRow({
            children: row.map((cell, ci) => tdCell(cell, ci !== 0)),
            shading:
              i % 2 === 1
                ? { fill: 'F0F4FF', type: ShadingType.SOLID }
                : undefined,
          })
      ),
    ],
  });
}

// ─── Document content ────────────────────────────────────────────────────────

const sections = [
  // ── Cover Page ──────────────────────────────────────────────────────────
  {
    properties: {},
    children: [
      emptyLine(),
      emptyLine(),
      new Paragraph({
        children: [bold('LAPORAN TEKNIS PENGEMBANGAN', 30)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [bold('SISTEM INFORMASI MANAJEMEN', 30)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [bold('SARANA DAN PRASARANA (SIM-SARPRAS)', 30)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [bold('UNIVERSITAS BHAMADA SLAWI', 30)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [normal('Diajukan kepada:', 24)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [bold('Kepala Bagian Sarana dan Prasarana', 26)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [bold('Sidiq Pranoto, S.Kep., Ns., M.Kep', 26)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [normal('Universitas Bhamada Slawi', 24)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [normal('Disusun oleh:', 24)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [bold('Subag. Sarana dan Prasarana', 24)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [bold('(Dwipa Ari Putra, S.Kom – Pjs. Kasubag Sarpras)', 24)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [bold(`Slawi, ${tanggal}`, 24)],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new PageBreak()],
      }),
    ],
  },

  // ── Main body ────────────────────────────────────────────────────────────
  {
    properties: {
      page: {
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        margin: {
          top: convertInchesToTwip(1.2),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.5),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              normal('SIM-SARPRAS – Universitas Bhamada Slawi', 18),
            ],
            border: {
              bottom: { color: '1E3A5F', space: 2, value: 'single', size: 8 },
            },
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              normal('Laporan Teknis SIM-SARPRAS  |  Halaman ', 18),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: 'Times New Roman',
                size: 18,
              }),
              normal(' dari ', 18),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                font: 'Times New Roman',
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
            border: {
              top: { color: 'CCCCCC', space: 2, value: 'single', size: 6 },
            },
          }),
        ],
      }),
    },
    children: [
      // ── I. PENDAHULUAN ───────────────────────────────────────────────────
      heading1('I. PENDAHULUAN'),

      heading2('1.1 Latar Belakang'),
      para([
        normal(
          'Universitas Bhamada Slawi sebagai perguruan tinggi yang terus berkembang memiliki kebutuhan pengelolaan sarana dan prasarana (Sarpras) yang semakin kompleks. Selama ini pengelolaan inventaris aset, pencatatan peminjaman, serta jadwal perawatan masih dilakukan secara manual menggunakan spreadsheet dan formulir fisik. Kondisi ini menimbulkan beberapa permasalahan, antara lain:'
        ),
      ]),
      new Paragraph({
        children: [normal('a)  Sulitnya pelacakan status aset secara real-time;')],
        spacing: { after: 80 },
        indent: { left: 720 },
      }),
      new Paragraph({
        children: [normal('b)  Proses pengajuan peminjaman yang memerlukan waktu lama karena harus tatap muka;')],
        spacing: { after: 80 },
        indent: { left: 720 },
      }),
      new Paragraph({
        children: [normal('c)  Tidak adanya arsip digital terpusat untuk KIR (Kartu Inventaris Ruangan);')],
        spacing: { after: 80 },
        indent: { left: 720 },
      }),
      new Paragraph({
        children: [normal('d)  Keterbatasan akses informasi bagi civitas akademika (mahasiswa, dosen, dan tenaga kependidikan).')],
        spacing: { after: 200 },
        indent: { left: 720 },
      }),
      para([
        normal(
          'Atas dasar tersebut, dikembangkanlah Sistem Informasi Manajemen Sarana dan Prasarana (SIM-SARPRAS) berbasis web yang dapat diakses oleh seluruh civitas akademika Universitas Bhamada Slawi tanpa memerlukan instalasi aplikasi khusus.'
        ),
      ]),

      heading2('1.2 Tujuan Pengembangan'),
      para([normal('Pengembangan SIM-SARPRAS bertujuan untuk:')]),
      new Paragraph({ children: [normal('1.  Menyediakan sistem inventaris aset digital (KIR) yang dapat diakses publik per ruangan;')], spacing: { after: 80 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('2.  Memfasilitasi pengajuan peminjaman sarana prasarana secara daring tanpa memerlukan login akun;')], spacing: { after: 80 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('3.  Menghadirkan alur persetujuan berlapis (Staff → Kepala Bagian Sarpras → Kepala Administrasi Umum) yang transparan dan dapat dilacak;')], spacing: { after: 80 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('4.  Memisahkan katalog aset tetap (tidak dapat dipinjam) dengan sarana prasarana yang dapat dipinjam;')], spacing: { after: 80 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('5.  Mendigitalkan jadwal perawatan alat pembelajaran elektronik, mesin, dan kelistrikan;')], spacing: { after: 80 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('6.  Menyediakan dashboard terpadu bagi pengelola Sarpras untuk mengelola seluruh data secara efisien.')], spacing: { after: 200 }, indent: { left: 720 } }),

      heading2('1.3 Ruang Lingkup'),
      para([
        normal(
          'Sistem ini dikembangkan khusus untuk Bagian Sarana dan Prasarana Universitas Bhamada Slawi dan mencakup pengelolaan: (1) inventaris aset tetap KIR, (2) katalog sarana prasarana yang dapat dipinjam, (3) manajemen peminjaman armada kendaraan, ruang kelas, gedung, dan peralatan portabel, serta (4) manajemen perawatan aset elektronik, mesin, dan kelistrikan.'
        ),
      ]),

      // ── II. GAMBARAN SISTEM ───────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('II. GAMBARAN UMUM SISTEM'),

      heading2('2.1 Nama dan Identitas Sistem'),
      makeTable(
        ['Atribut', 'Keterangan'],
        [
          ['Nama Sistem', 'SIM-SARPRAS (Sistem Informasi Manajemen Sarana dan Prasarana)'],
          ['Institusi', 'Universitas Bhamada Slawi (Yayasan Pendidikan Tri Sanja Husada)'],
          ['Pengelola', 'Bagian Sarana dan Prasarana (BAU)'],
          ['Kepala BAU', 'Sidiq Pranoto, S.Kep., Ns., M.Kep'],
          ['Pjs. Kasubag Sarpras', 'Dwipa Ari Putra, S.Kom'],
          ['Versi', '1.0.0 (Beta)'],
          ['Tanggal Laporan', tanggal],
          ['Platform', 'Web Application (dapat diakses dari browser tanpa instalasi)'],
          ['Teknologi Utama', 'Next.js 16, React 19, Supabase (PostgreSQL Cloud), Tailwind CSS 4'],
        ]
      ),
      emptyLine(),

      heading2('2.2 Arsitektur Sistem'),
      para([
        normal(
          'SIM-SARPRAS dibangun dengan arsitektur Full-Stack menggunakan framework Next.js versi 16 dengan App Router. Database menggunakan layanan cloud Supabase (PostgreSQL) yang menjamin keamanan, skalabilitas, dan ketersediaan data 24/7. Berikut gambaran arsitektur sistem:'
        ),
      ]),
      makeTable(
        ['Lapisan', 'Teknologi', 'Fungsi'],
        [
          ['Frontend (UI)', 'Next.js 16 + React 19 + Tailwind CSS 4', 'Antarmuka pengguna yang responsif dan modern'],
          ['Backend (API)', 'Next.js API Routes (Server-side)', 'Logika bisnis, validasi, dan autentikasi'],
          ['Database', 'Supabase (PostgreSQL Cloud)', 'Penyimpanan data aset, peminjaman, maintenance'],
          ['Autentikasi', 'JWT Cookie-based (httpOnly)', 'Login aman untuk pengelola Sarpras'],
          ['Deployment', 'Vercel / GitHub Pages (Static Export)', 'Hosting gratis dengan CDN global'],
        ]
      ),
      emptyLine(),

      heading2('2.3 Pengguna Sistem'),
      makeTable(
        ['Jenis Pengguna', 'Akses', 'Kebutuhan Login'],
        [
          ['Mahasiswa / Dosen / Tendik', 'Lihat katalog, ajukan peminjaman, lacak status', 'Tidak Perlu Login'],
          ['Staff Sarpras', 'Verifikasi peminjaman, kelola aset, input maintenance', 'Login Wajib'],
          ['Kepala Bagian Sarpras', 'Persetujuan peminjaman (tanda tangan 1), lihat semua data', 'Login Wajib'],
          ['Kepala Administrasi Umum', 'Persetujuan peminjaman (tanda tangan 2), laporan global', 'Login Wajib'],
          ['Admin Sistem', 'Akses penuh semua fitur termasuk manajemen akun', 'Login Wajib'],
        ]
      ),
      emptyLine(),

      // ── III. FITUR SISTEM ─────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('III. FITUR-FITUR SISTEM'),

      heading2('3.1 Halaman Publik (Tanpa Login)'),

      heading3('A. Beranda Utama (/)'),
      para([normal('Halaman beranda menampilkan ringkasan layanan Sarpras, statistik aset kampus, serta akses cepat ke layanan peminjaman dan inventaris KIR. Civitas akademika dapat langsung melihat sarana prasarana yang tersedia untuk dipinjam dari halaman ini.')]),

      heading3('B. Katalog Sarana Prasarana yang Dapat Dipinjam (/katalog)'),
      para([normal('Halaman ini memisahkan dengan jelas aset yang bisa dipinjam oleh civitas akademika. Terdapat filter berdasarkan kategori: Peralatan Portabel, Kendaraan, Ruang Kelas & Aula, dan Gedung. Setiap aset ditampilkan dengan informasi kondisi, kapasitas, lokasi, dan tombol aksi langsung menuju formulir peminjaman.')]),

      heading3('C. Inventaris KIR per Ruangan (/inventaris)'),
      para([normal('Halaman inventaris menampilkan Kartu Inventaris Ruangan (KIR) secara digital. Data dikelompokkan per ruangan sehingga memudahkan pengecekan aset tetap di setiap kelas, laboratorium, atau area kampus. Halaman ini bisa dilihat publik namun hanya untuk keperluan informasi (tidak bisa dipinjam dari sini).')]),

      heading3('D. Formulir Pengajuan Peminjaman (/pinjam)'),
      para([normal('Formulir empat langkah untuk mengajukan peminjaman sarpras tanpa perlu membuat akun. Pemohon mengisi: (1) pilihan sarpras berdasarkan kategori, (2) jadwal peminjaman, (3) identitas pemohon, dan (4) keperluan. Setelah submit, pemohon menerima Kode Tiket unik untuk pelacakan.')]),

      heading3('E. Pelacakan Status Peminjaman (/tracking)'),
      para([normal('Dengan memasukkan Kode Tiket yang diterima saat pengajuan, pemohon dapat memantau status proses persetujuan secara real-time. Terdapat tampilan timeline yang menunjukkan setiap tahapan: pengajuan masuk → verifikasi staff → persetujuan Ka. Sarpras → persetujuan Ka. Administrasi Umum → pengiriman → pengembalian.')]),

      heading3('F. Jadwal Ketersediaan (/jadwal)'),
      para([normal('Halaman yang menampilkan jadwal penggunaan sarpras yang sedang aktif atau direncanakan, membantu civitas akademika mengetahui ketersediaan fasilitas sebelum mengajukan peminjaman.')]),

      heading2('3.2 Dashboard Pengelola (Memerlukan Login)'),

      heading3('A. Dashboard Utama (/dashboard)'),
      para([normal('Ringkasan KPI (Key Performance Indicator) sistem secara real-time: jumlah pengajuan menunggu persetujuan, jumlah sarpras sedang digunakan, jumlah perawatan aktif, serta daftar pengajuan dan perawatan terbaru.')]),

      heading3('B. Dashboard Peminjaman (/dashboard/peminjaman)'),
      para([
        normal(
          'Modul lengkap pengelolaan peminjaman dengan fitur:'
        ),
      ]),
      new Paragraph({ children: [normal('•  Filter berdasarkan status (menunggu, disetujui, sedang dipakai, dikembalikan);')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Proses verifikasi oleh Staff Sarpras;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Proses persetujuan oleh Kepala Bagian Sarpras;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Proses persetujuan oleh Kepala Administrasi Umum;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Cetak surat izin peminjaman resmi berkop surat;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Konfirmasi pengiriman dan pengembalian aset.')], spacing: { after: 200 }, indent: { left: 720 } }),

      heading3('C. Dashboard Inventaris (/dashboard/inventaris)'),
      para([
        normal(
          'Modul pengelolaan data aset dengan fitur:'
        ),
      ]),
      new Paragraph({ children: [normal('•  Tambah, edit, dan hapus aset dari inventaris;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Pilihan peruntukan aset: disimpan di Inventaris Aset Tetap (KIR) atau Sarana Prasarana yang Dapat Dipinjam;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Filter berdasarkan ruangan, kategori, kondisi, dan peruntukan;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Import data massal dari file CSV;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Tampilan KIR per ruangan lengkap dengan data keuangan (harga perolehan, nilai buku, depresiasi).')], spacing: { after: 200 }, indent: { left: 720 } }),

      heading3('D. Dashboard Perawatan (/dashboard/perawatan)'),
      para([
        normal(
          'Modul pengelolaan jadwal maintenance aset dengan fitur:'
        ),
      ]),
      new Paragraph({ children: [normal('•  Buat, update, dan selesaikan jadwal perawatan;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Spesialisasi kategori: elektronik, mesin, dan kelistrikan;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Penugasan teknisi;')], spacing: { after: 60 }, indent: { left: 720 } }),
      new Paragraph({ children: [normal('•  Riwayat perawatan per aset.')], spacing: { after: 200 }, indent: { left: 720 } }),

      heading3('E. Dashboard Akun (/dashboard/akun)'),
      para([normal('Manajemen akun pengguna sistem (staff, kepala bagian, kepala admin umum). Admin dapat menambah, mengedit, dan menghapus akun pengelola.')]),

      // ── IV. ALUR KERJA ─────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('IV. ALUR KERJA SISTEM'),

      heading2('4.1 Alur Pengajuan dan Persetujuan Peminjaman'),
      makeTable(
        ['Tahap', 'Pelaku', 'Aksi', 'Status'],
        [
          ['1', 'Pemohon (tanpa login)', 'Mengisi formulir peminjaman online', 'PENDING'],
          ['2', 'Sistem', 'Menerbitkan Kode Tiket unik', 'PENDING'],
          ['3', 'Staff Sarpras', 'Verifikasi kelengkapan data dan ketersediaan aset', 'STAFF_VERIFIED'],
          ['4', 'Kepala Bagian Sarpras', 'Persetujuan atau penolakan pengajuan', 'HEAD_APPROVED / REJECTED'],
          ['5', 'Kepala Administrasi Umum', 'Persetujuan atau penolakan akhir', 'ADMIN_APPROVED / REJECTED'],
          ['6', 'Staff Sarpras', 'Pengeluaran / pengiriman aset ke pemohon', 'DISPATCHED'],
          ['7', 'Staff Sarpras', 'Konfirmasi pengembalian aset', 'RETURNED'],
        ]
      ),
      emptyLine(),
      para([
        italic(
          'Catatan: Setiap pihak yang berwenang dapat memberikan persetujuan secara independen tanpa harus menunggu pihak lain, selama data sudah diverifikasi oleh Staff Sarpras.'
        ),
      ]),

      heading2('4.2 Alur Pengelolaan Inventaris Aset'),
      makeTable(
        ['Langkah', 'Aksi'],
        [
          ['1', 'Admin/Staff input data aset baru dari dashboard inventaris'],
          ['2', 'Pilih peruntukan: Inventaris Aset Tetap (KIR) atau Sarana Prasarana yang Dapat Dipinjam'],
          ['3', 'Aset tersimpan di database dengan kategori, lokasi, dan spesifikasi yang sesuai'],
          ['4', 'Aset KIR muncul di halaman /inventaris (publik, tidak bisa dipinjam)'],
          ['5', 'Aset Sarpras Dipinjam muncul di halaman /katalog (publik, bisa dipinjam)'],
          ['6', 'Staff dapat mengedit, update kondisi, atau mengubah peruntukan aset kapan saja'],
        ]
      ),
      emptyLine(),

      heading2('4.3 Alur Perawatan Aset'),
      makeTable(
        ['Langkah', 'Aksi'],
        [
          ['1', 'Staff/Admin membuat jadwal maintenance di dashboard perawatan'],
          ['2', 'Isi data: aset, kategori perawatan (elektronik/mesin/listrik), teknisi, tanggal jadwal'],
          ['3', 'Status: SCHEDULED → IN_PROGRESS → COMPLETED'],
          ['4', 'Riwayat perawatan tercatat permanen di database'],
        ]
      ),
      emptyLine(),

      // ── V. PEMISAHAN KATALOG ─────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('V. PEMISAHAN KATALOG ASET'),

      heading2('5.1 Latar Belakang Pemisahan'),
      para([
        normal(
          'Salah satu fitur kunci SIM-SARPRAS adalah pemisahan tegas antara dua jenis aset kampus yang berbeda tujuan dan pengelolaannya. Hal ini bertujuan menghindari kebingungan antara aset tetap yang hanya dicatat untuk pembukuan (KIR) dengan aset yang memang tersedia untuk dipinjam oleh civitas akademika.'
        ),
      ]),

      heading2('5.2 Perbandingan Dua Jenis Katalog'),
      makeTable(
        ['Aspek', 'Inventaris Aset Tetap (KIR)', 'Sarana Prasarana yang Dapat Dipinjam'],
        [
          ['Tujuan', 'Pembukuan dan pendataan aset kampus sesuai standar KIR', 'Layanan peminjaman untuk civitas akademika'],
          ['Contoh Aset', 'AC, CCTV, komputer ruangan, meja, kursi, whiteboard', 'Proyektor, mikrofon, kendaraan kampus, ruang kelas, gedung aula'],
          ['Akses Publik', 'Bisa dilihat sebagai referensi (read-only)', 'Bisa dilihat dan diajukan peminjaman'],
          ['Halaman', '/inventaris (dikelompokkan per ruangan)', '/katalog (dengan filter kategori)'],
          ['Form Pinjam', 'Tidak tersedia', 'Tersedia (link langsung ke /pinjam)'],
          ['Data Keuangan', 'Tampil (harga beli, depresiasi, nilai buku)', 'Tidak ditampilkan ke publik'],
          ['Dikelola di', 'Dashboard Inventaris (tab KIR)', 'Dashboard Inventaris (tab Sarpras Pinjam)'],
        ]
      ),
      emptyLine(),

      heading2('5.3 Kategori Aset dalam Sistem'),
      makeTable(
        ['Kode Kategori', 'Nama', 'Default Peruntukan'],
        [
          ['ELECTRONIC', 'Elektronik', 'Tergantung jenis (proyektor → Pinjam; AC/CCTV → KIR)'],
          ['FURNITURE', 'Perabot/Furnitur', 'Inventaris KIR (aset tetap ruangan)'],
          ['MACHINERY', 'Mesin', 'Inventaris KIR'],
          ['ELECTRICAL', 'Kelistrikan', 'Inventaris KIR'],
          ['VEHICLE', 'Kendaraan', 'Sarana Prasarana yang Dapat Dipinjam'],
          ['ROOM', 'Ruang Kelas / Lab', 'Sarana Prasarana yang Dapat Dipinjam'],
          ['BUILDING', 'Gedung / Aula', 'Sarana Prasarana yang Dapat Dipinjam'],
        ]
      ),
      emptyLine(),

      // ── VI. KEAMANAN ──────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('VI. KEAMANAN DAN PRIVASI DATA'),

      heading2('6.1 Mekanisme Autentikasi'),
      para([
        normal(
          'Sistem menggunakan autentikasi berbasis JSON Web Token (JWT) yang disimpan dalam cookie httpOnly. Cookie ini tidak dapat diakses oleh JavaScript di sisi klien, sehingga mencegah serangan XSS (Cross-Site Scripting). Setiap permintaan ke API yang memerlukan autentikasi akan divalidasi token-nya di sisi server.'
        ),
      ]),

      heading2('6.2 Pembagian Akses Berbasis Peran (RBAC)'),
      makeTable(
        ['Peran', 'Kode', 'Akses Khusus'],
        [
          ['Admin Sistem', 'ADMIN', 'Akses penuh: semua fitur + manajemen akun pengguna'],
          ['Staff Sarpras', 'STAFF_SARPRAS', 'Verifikasi peminjaman, kelola inventaris, kelola perawatan'],
          ['Kepala Bagian Sarpras', 'KEPALA_SARPRAS', 'Persetujuan peminjaman tingkat 1, lihat semua laporan'],
          ['Kepala Administrasi Umum', 'KEPALA_ADMIN_UMUM', 'Persetujuan peminjaman tingkat 2, statistik global'],
          ['Publik', '(Tanpa Akun)', 'Lihat katalog, inventaris KIR, ajukan peminjaman, lacak tiket'],
        ]
      ),
      emptyLine(),

      heading2('6.3 Perlindungan Data'),
      para([normal('Data sensitif pengguna (nomor HP, email) tidak ditampilkan ke publik dan hanya bisa diakses oleh pengelola yang berwenang melalui dashboard. Koneksi database menggunakan Supabase Service Role Key yang hanya tersimpan di server (tidak pernah dikirim ke browser klien).')]),

      // ── VII. INFRASTRUKTUR ────────────────────────────────────────────────
      heading1('VII. INFRASTRUKTUR DAN DEPLOYMENT'),

      heading2('7.1 Pilihan Deployment'),
      makeTable(
        ['Platform', 'Status', 'Catatan'],
        [
          ['Vercel', 'Direkomendasikan', 'Integrasi langsung dengan GitHub, HTTPS otomatis, gratis untuk skala kampus'],
          ['GitHub Pages', 'Bisa (Static Export)', 'Gratis, cocok untuk percobaan awal, memerlukan konfigurasi tambahan'],
          ['Hosting Kampus', 'Bisa', 'Memerlukan Node.js 18+ di server kampus'],
        ]
      ),
      emptyLine(),

      heading2('7.2 Kebutuhan Sistem Minimum'),
      makeTable(
        ['Komponen', 'Kebutuhan'],
        [
          ['Node.js', 'Versi 18 atau lebih baru'],
          ['Browser', 'Chrome 90+, Firefox 88+, Edge 90+, Safari 14+'],
          ['Koneksi Internet', 'Diperlukan untuk akses database Supabase cloud'],
          ['Akun Supabase', 'Gratis tier (hingga 500 MB data, 2 GB bandwidth/bulan)'],
          ['Akun GitHub', 'Untuk penyimpanan kode (repository)'],
          ['Akun Vercel', 'Opsional, untuk deployment gratis'],
        ]
      ),
      emptyLine(),

      // ── VIII. REKOMENDASI ─────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('VIII. REKOMENDASI DAN RENCANA PENGEMBANGAN'),

      heading2('8.1 Rekomendasi Jangka Pendek (0–3 Bulan)'),
      makeTable(
        ['No', 'Item Rekomendasi', 'Prioritas'],
        [
          ['1', 'Sosialisasi sistem kepada seluruh civitas akademika via email/WhatsApp resmi kampus', 'Tinggi'],
          ['2', 'Migrasi data inventaris dari spreadsheet lama ke database SIM-SARPRAS', 'Tinggi'],
          ['3', 'Pelatihan penggunaan dashboard bagi Staff dan Kepala Bagian Sarpras', 'Tinggi'],
          ['4', 'Testing end-to-end alur peminjaman dengan data riil', 'Tinggi'],
          ['5', 'Deployment ke Vercel dengan domain khusus (contoh: sarpras.bhamada.ac.id)', 'Sedang'],
        ]
      ),
      emptyLine(),

      heading2('8.2 Rencana Pengembangan Jangka Menengah (3–12 Bulan)'),
      makeTable(
        ['No', 'Fitur Pengembangan', 'Keterangan'],
        [
          ['1', 'Notifikasi WhatsApp / Email Otomatis', 'Kirim notifikasi ke pemohon ketika status peminjaman berubah'],
          ['2', 'Laporan Otomatis PDF/Excel', 'Generate laporan bulanan/tahunan langsung dari dashboard'],
          ['3', 'QR Code Inventaris', 'Stiker QR di setiap aset untuk scan dan lihat detail'],
          ['4', 'Foto Aset', 'Upload dan tampilkan foto kondisi aset terkini'],
          ['5', 'Integrasi SSO Kampus', 'Login dengan akun email institusi (@bhamada.ac.id)'],
          ['6', 'Aplikasi Mobile', 'Versi PWA (Progressive Web App) untuk akses dari smartphone'],
        ]
      ),
      emptyLine(),

      // ── IX. PENUTUP ───────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      heading1('IX. PENUTUP'),
      para([
        normal(
          'SIM-SARPRAS Universitas Bhamada Slawi merupakan langkah nyata transformasi digital di bidang pengelolaan sarana dan prasarana kampus. Sistem ini dirancang dengan pendekatan yang memudahkan semua pihak: civitas akademika dapat mengajukan peminjaman tanpa birokrasi yang rumit, sementara pengelola Sarpras mendapatkan alat bantu yang kuat dan efisien untuk mengelola aset, persetujuan, dan perawatan.'
        ),
      ]),
      para([
        normal(
          'Dengan dukungan penuh dari Kepala Bagian Sarana dan Prasarana serta komitmen dari seluruh tim Sarpras, sistem ini diharapkan dapat meningkatkan kualitas layanan, transparansi pengelolaan aset, dan efisiensi operasional secara signifikan. Pengembangan sistem ini bersifat berkelanjutan dan terbuka untuk masukan serta penyesuaian sesuai kebutuhan nyata di lapangan.'
        ),
      ]),
      para([
        normal(
          'Atas perhatian dan kepercayaan yang diberikan, kami mengucapkan terima kasih. Semoga sistem ini dapat memberikan manfaat yang nyata bagi seluruh keluarga besar Universitas Bhamada Slawi.'
        ),
      ]),

      emptyLine(),
      emptyLine(),
      new Paragraph({
        children: [normal(`Slawi, ${tanggal}`, 24)],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [normal('Pjs. Kasubag Sarana dan Prasarana,', 24)],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [bold('Dwipa Ari Putra, S.Kom', 24)],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
      }),

      emptyLine(),
      emptyLine(),
      new Paragraph({
        children: [normal('Mengetahui,', 24)],
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [normal('Kepala Bagian Sarana dan Prasarana', 24)],
        alignment: AlignmentType.LEFT,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [bold('Sidiq Pranoto, S.Kep., Ns., M.Kep', 24)],
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
      }),
    ],
  },
];

const doc = new Document({ sections });

const buffer = await Packer.toBuffer(doc);
writeFileSync(
  'C:\\Users\\MSI B5DD\\Desktop\\Laporan_SIM_SARPRAS_Bhamada.docx',
  buffer
);
console.log('✅ Laporan berhasil dibuat: Laporan_SIM_SARPRAS_Bhamada.docx (Desktop)');
