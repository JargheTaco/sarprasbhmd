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

- Melihat katalog sarana prasarana seperti mobil kampus, ruang kelas, aula, auditorium, alat elektronik, dan fasilitas lain.
- Mengajukan peminjaman tanpa membuat akun atau login.
- Memilih aset, tanggal dan waktu penggunaan, tujuan, lokasi, serta kebutuhan pengemudi.
- Mengajukan peminjaman ruang dengan memilih gedung dan nama atau nomor ruangan.
- Mendapatkan kode tiket unik setelah pengajuan berhasil dikirim.
- Melacak status permohonan melalui kode tiket.
- Melihat detail tahapan verifikasi Staff Sarpras, persetujuan Kepala Sarpras, serah terima, penggunaan, dan pengembalian.
- Mengakses surat izin resmi untuk pengajuan yang sudah disetujui.
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
- Mengelola data inventaris aset dan informasi kondisi aset.
- Membuat serta memantau tiket perawatan aset elektronik, mesin, dan kelistrikan.
- Mengelola akun pengguna jika login sebagai Administrator.

## Alur Peminjaman

1. Pemohon mengisi formulir peminjaman dan menerima kode tiket.
2. Staff Sarpras memeriksa ketersediaan serta kondisi sarpras.
3. Kepala Sarpras memberikan persetujuan atau penolakan.
4. Pengajuan yang disetujui dapat diproses untuk serah terima dan penggunaan.
5. Setelah selesai digunakan, petugas mencatat pengembalian dan checklist kondisi akhir.

Status yang digunakan antara lain `PENDING_STAFF`, `PENDING_HEAD`, `APPROVED`, `IN_USE`, `RETURNED`, dan `REJECTED`.

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
