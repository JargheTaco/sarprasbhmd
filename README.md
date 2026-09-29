# SIM-SARPRAS Universitas Bhamada Slawi

SIM-SARPRAS adalah sistem informasi pengelolaan sarana dan prasarana Universitas Bhamada Slawi. Web ini digunakan untuk mengajukan, memverifikasi, menyetujui, melacak, dan mengelola peminjaman aset kampus secara terpusat.

## Dibuat Dengan Apa?

- **Bahasa pemrograman:** TypeScript
- **Framework utama:** Next.js 16 dengan App Router
- **Antarmuka:** React 19 dan Tailwind CSS 4
- **Ikon:** Lucide React
- **Database:** Supabase PostgreSQL
- **API:** Next.js Route Handlers pada folder `src/app/api`
- **Autentikasi:** Session berbasis cookie dengan role `ADMIN`, `STAFF_SARPRAS`, dan `KEPALA_SARPRAS`
- **Linting:** ESLint 9 dengan konfigurasi Next.js

## Yang Bisa Dilakukan

### Untuk pemohon dan publik

- Melihat katalog sarana prasarana yang dapat dipinjam seperti mobil kampus, ruang kelas, aula, auditorium, alat elektronik, dan fasilitas lain.
- Mengajukan peminjaman tanpa membuat akun atau login.
- Memilih aset, tanggal dan waktu penggunaan, tujuan, lokasi, serta kebutuhan pengemudi.
- Mengajukan peminjaman ruang atau gedung dengan memilih gedung dan nama/nomor ruangan atau area.
- Mendapatkan kode tiket unik setelah pengajuan berhasil dikirim.
- Melacak status permohonan melalui kode tiket.
- Melihat detail tahapan verifikasi Staff Sarpras, persetujuan Kepala Sarpras, serah terima, penggunaan, dan pengembalian.
- Mencetak Surat Peminjaman sebagai bukti resmi ke CS Ruangan. Tombol cetak muncul setelah pengajuan disetujui dan tetap bisa dipakai saat sarpras sedang dipinjam (`IN_USE`) maupun setelah dikembalikan (`RETURNED`).
- Surat Peminjaman dilengkapi blok **Bukti Penerimaan Ruangan / Serah Terima** yang ditandatangani pemohon bersama petugas jaga atau CS Ruangan, berisi tanggal & jam diterima, kondisi saat diterima, dan tanggal pengembalian.
- Melihat jadwal pemakaian aktif dan memeriksa ketersediaan sarpras sebelum mengajukan peminjaman.
- Menelusuri inventaris ruangan dan kelas berdasarkan gedung, ruangan, nama barang, kode, atau spesifikasi.
- Menampilkan Kartu Inventaris Ruangan (KIR) untuk ruangan tertentu.

### Untuk petugas Sarpras

Petugas login melalui `/login` untuk membuka dashboard manajemen. Fitur yang tersedia menyesuaikan role pengguna:

- Melihat ringkasan statistik aset, peminjaman, dan perawatan.
- Memproses antrean pengajuan peminjaman.
- Melakukan verifikasi Staff melalui checklist ketersediaan dan kondisi fisik sarpras.
- Memberikan persetujuan akhir sebagai Kepala Sarpras melalui checklist.
- Mencatat serah terima, penggunaan aset, dan pengembalian.
- Mencatat identitas petugas atau CS ruangan yang menerima sarpras beserta kondisi barang saat serah terima. Data ini otomatis tercetak pada kolom tanda tangan petugas di Surat Peminjaman.
- Mengelola data inventaris aset dan informasi kondisi aset.
- Memilih apakah aset disimpan sebagai Inventaris Aset (tetap) atau Sarana Prasarana (dapat dipinjam) saat menambah, mengubah, atau mengimpor aset.
- Memfilter arsip aset berdasarkan kategori dan jenis katalog.
- Membuat serta memantau tiket perawatan aset elektronik, mesin, dan kelistrikan.
- Mengelola akun pengguna jika login sebagai Administrator.

## Pemisahan Inventaris Aset dan Sarana Prasarana

Setiap aset pada tabel `assets` memiliki kolom `asset_type` dengan dua nilai:

- `INVENTARIS` — aset tetap milik kampus (meja, kursi, AC, instalasi listrik) yang dikelola lewat portal `/inventaris` dan dashboard Inventaris.
- `SARANA_PRASARANA` — barang atau fasilitas yang bisa dipinjam, tampil di katalog `/katalog` dan form `/pinjam`.

Nilai ini dapat diatur dari form aset, form impor CSV, dan API. Endpoint `GET /api/assets` menerima filter `asset_type=INVENTARIS` atau `asset_type=SARANA_PRASARANA` (filter lama `loanable=true` masih didukung sebagai alias). Aset tanpa nilai eksplisit memakai saranan otomatis: kategori `VEHICLE`, `ROOM`, dan `BUILDING` masuk ke Sarana Prasarana, selain itu menjadi Inventaris Aset.

## Alur Peminjaman

Tiap pihak menyetujui **sendiri-sendiri** sesuai checkbox miliknya, tanpa harus menunggu pihak lain, dan **tidak saling menggantikan**.

### Pemisahan kewenangan

Setiap checklist hanya boleh diisi oleh akun pemiliknya:

| Checklist | Akun yang berwenang |
| --- | --- |
| Verifikasi Staff Sarpras | `STAFF_SARPRAS` |
| Persetujuan Kepala Bagian Sarpras | `KEPALA_SARPRAS` |
| Persetujuan Kepala Administrasi Umum | `KEPALA_ADMIN_UMUM` |

Staff Sarpras tidak dapat menyetujui checklist Kepala, dan Kepala Bagian tidak dapat menyetujui checklist Administrasi Umum. Role `ADMIN` tetap dapat menutupi seluruh tahap sebagai kewenangan cadangan, tetapi antarmuka menampilkan peringatan konfirmasi lebih dulu, dan tanda tangannya tetap tercatat atas namanya sendiri.

### Tahapan

1. Pemohon mengisi formulir peminjaman dan menerima kode tiket.
2. Pengajuan menunggu di status `PENDING_APPROVAL` sampai tiga tanda tangan terkumpul.
3. Setiap pihak bisa langsung menyetujui atau menolak kapan saja, dalam urutan apa pun. Kepala Bagian tidak perlu menunggu checklist staff selesai, dan sebaliknya.
4. Setelah ketiga checklist terisi, peminjaman **langsung aktif** berstatus `IN_USE` dan aset ditandai `DIPINJAM`. Tidak ada lagi tahap Serah Terima terpisah.
5. Bila satu pihak menolak, pengajuan langsung berstatus `REJECTED`.
6. Setelah selesai digunakan, petugas mencatat pengembalian dan checklist kondisi akhir.

Status yang digunakan antara lain `PENDING_APPROVAL`, `IN_USE`, `RETURNED`, dan `REJECTED`.

### Endpoint Persetujuan

Setiap endpoint hanya menandatangani checklist milik tahapnya sendiri, dan tercatat atas nama pengguna yang menekan tombol. Endpoint mengembalikan `403` bila diakses role yang tidak berhak.

| Endpoint | Checkbox yang dicatat |
| --- | --- |
| `POST /api/loans/[ticket]/staff-verify` | Verifikasi Staff Sarpras |
| `POST /api/loans/[ticket]/head-approve` | Persetujuan Kepala Bagian Sarpras |
| `POST /api/loans/[ticket]/admin-approve` | Persetujuan Kepala Administrasi Umum |

Ketiganya dapat diakses selama pengajuan masih berstatus menunggu, sehingga tidak ada lagi tahapan yang terkunci menunggu pihak sebelumnya.

## Menjalankan Project

Pastikan Node.js dan npm sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

Perintah lain yang tersedia:

```bash
npm run lint
npm run build
npm run start
```

## Konfigurasi Database

Project ini menggunakan Supabase PostgreSQL. Jalankan isi [supabase-schema.sql](supabase-schema.sql) melalui Supabase SQL Editor sebelum menggunakan API atau melakukan deployment.

Buat file `.env.local` dengan variabel berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
AUTH_SECRET=replace-with-a-long-random-secret
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan di sisi server. Jangan menambahkan prefix `NEXT_PUBLIC_` pada variabel tersebut.

## Struktur Utama

```text
src/app/              Halaman publik, dashboard, dan API route
src/components/       Komponen UI yang digunakan bersama
src/lib/               Koneksi database, Supabase, dan autentikasi
data/                  Data mentah inventaris
scripts/               Script untuk seed data inventaris
supabase-schema.sql    Struktur tabel PostgreSQL
```
