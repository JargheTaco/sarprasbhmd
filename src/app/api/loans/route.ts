import { assertSupabaseConfigured, supabaseAdmin, supabaseConfigErrorMessage } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    assertSupabaseConfigured();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const assetId = searchParams.get('asset_id');
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    let query = supabaseAdmin.from('loan_requests').select('*, assets(name, code, category, location, specs)');

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    if (category && category !== 'ALL') {
      query = query.eq('assets.category', category);
    }

    if (q) {
      query = query.or(`ticket_code.ilike.%${q}%,borrower_name.ilike.%${q}%,borrower_id.ilike.%${q}%,borrower_phone.ilike.%${q}%,purpose.ilike.%${q}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    const loans = (data || []).map((loan) => ({
      ...loan,
      asset_name: loan.assets?.name || `Ruangan ${loan.room_name || ''}`.trim(),
      asset_code: loan.assets?.code || `${loan.room_building || ''} / ${loan.room_name || ''}`.trim(),
      asset_category: loan.assets?.category || 'ROOM',
      asset_location: loan.assets?.location || loan.room_building || '-',
      asset_specs: loan.assets?.specs,
      assets: undefined,
    }));
    return NextResponse.json({ success: true, loans });
  } catch (err: unknown) {
    console.error('Fetch loans error:', err);
    const message = err instanceof Error && err.message.includes('Supabase belum dikonfigurasi')
      ? supabaseConfigErrorMessage
      : 'Gagal memuat data peminjaman';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

// PUBLIC SUBMISSION - NO LOGIN REQUIRED
export async function POST(req: NextRequest) {
  try {
    assertSupabaseConfigured();
    const body = await req.json();
    const {
      borrower_name,
      borrower_id,
      borrower_role,
      borrower_phone,
      borrower_email,
      asset_id,
      start_date,
      start_time,
      end_date,
      end_time,
      purpose,
      destination,
      driver_needed,
      attachment_url,
      room_building,
      room_name,
    } = body;

    // Validation
    if (
      !borrower_name ||
      !borrower_id ||
      !borrower_phone ||
      (!asset_id && !(room_building && room_name)) ||
      !start_date ||
      !start_time ||
      !end_date ||
      !end_time ||
      !purpose
    ) {
      return NextResponse.json(
        { error: 'Mohon lengkapi seluruh kolom formulir yang wajib diisi' },
        { status: 400 }
      );
    }

    const isRoomLoan = !asset_id && room_building && room_name;

    // Check if asset exists and is not permanently broken
    interface AssetCheck {
      id: string;
      name: string;
      condition: string;
      status: string;
    }
    let asset: AssetCheck | null = null;
    if (!isRoomLoan) {
      const { data: selectedAsset, error: assetError } = await supabaseAdmin
        .from('assets')
        .select('id, name, condition, status')
        .eq('id', asset_id)
        .maybeSingle<AssetCheck>();
      if (assetError) throw assetError;
      asset = selectedAsset;
      if (!asset) {
        return NextResponse.json({ error: 'Sarpras / Aset yang dipilih tidak ditemukan' }, { status: 404 });
      }
    }

    if (asset && asset.condition === 'RUSAK_BERAT') {
      return NextResponse.json(
        { error: `Sarpras (${asset.name}) saat ini rusak berat dan tidak dapat dipinjam` },
        { status: 400 }
      );
    }

    // Check for scheduling conflict with already approved or active loans
    const startIso = `${start_date} ${start_time}`;
    const endIso = `${end_date} ${end_time}`;

    if (startIso >= endIso) {
      return NextResponse.json(
        { error: 'Waktu selesai peminjaman harus lebih akhir dari waktu mulai' },
        { status: 400 }
      );
    }

    interface ConflictRow {
      ticket_code: string;
      start_date: string;
      start_time: string;
      end_date: string;
      end_time: string;
    }

    let conflictQuery = supabaseAdmin
      .from('loan_requests')
      .select('ticket_code, start_date, start_time, end_date, end_time')
      .in('status', ['APPROVED', 'IN_USE', 'PENDING_HEAD']);
    conflictQuery = isRoomLoan
      ? conflictQuery.eq('room_building', room_building).eq('room_name', room_name.trim())
      : conflictQuery.eq('asset_id', asset_id);
    const { data: possibleConflicts, error: conflictError } = await conflictQuery;
    if (conflictError) throw conflictError;
    const conflict = (possibleConflicts || []).find((row) =>
      `${row.start_date} ${row.start_time}` < endIso && `${row.end_date} ${row.end_time}` > startIso
    ) as ConflictRow | undefined;

    if (conflict) {
      return NextResponse.json(
        {
          error: `Jadwal bentrok dengan peminjaman lain (${conflict.ticket_code}) pada tanggal ${conflict.start_date} ${conflict.start_time} s/d ${conflict.end_date} ${conflict.end_time}. Silakan pilih waktu atau unit lain.`
        },
        { status: 409 }
      );
    }

    // Generate unique friendly ticket code: SARPRAS-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const { count, error: countError } = await supabaseAdmin
      .from('loan_requests')
      .select('id', { count: 'exact', head: true })
      .like('ticket_code', `SARPRAS-${currentYear}-%`);
    if (countError) throw countError;

    const sequence = ((count || 0) + 1).toString().padStart(4, '0');
    const ticketCode = `SARPRAS-${currentYear}-${sequence}`;

    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from('loan_requests').insert({
      id,
      ticket_code: ticketCode,
      borrower_name,
      borrower_id,
      borrower_role: borrower_role || 'Mahasiswa',
      borrower_phone,
      borrower_email: borrower_email || null,
      asset_id: isRoomLoan ? null : asset_id,
      room_building: isRoomLoan ? room_building : null,
      room_name: isRoomLoan ? room_name.trim() : null,
      start_date,
      start_time,
      end_date,
      end_time,
      purpose,
      destination: destination || null,
      driver_needed: !!driver_needed,
      attachment_url: attachment_url || null,
      status: 'PENDING_STAFF',
      created_at: now,
    });
    if (insertError) throw insertError;

    const { data: createdRow, error: createdError } = await supabaseAdmin
      .from('loan_requests')
      .select('*, assets(name, code, category)')
      .eq('id', id)
      .single();
    if (createdError) throw createdError;
    const createdLoan = {
      ...createdRow,
      asset_name: createdRow.assets?.name || `Ruangan ${createdRow.room_name || ''}`.trim(),
      asset_code: createdRow.assets?.code || `${createdRow.room_building || ''} / ${createdRow.room_name || ''}`.trim(),
      asset_category: createdRow.assets?.category || 'ROOM',
      assets: undefined,
    };

    return NextResponse.json({
      success: true,
      ticket_code: ticketCode,
      loan: createdLoan,
      message: 'Pengajuan peminjaman berhasil dikirim. Simpan kode tiket untuk pelacakan.',
    });
  } catch (err: unknown) {
    console.error('Submit loan error:', err);
    const message = err instanceof Error && err.message.includes('Supabase belum dikonfigurasi')
      ? supabaseConfigErrorMessage
      : 'Terjadi kegagalan server saat memproses pengajuan peminjaman';
    return NextResponse.json(
      { error: message },
      { status: 503 }
    );
  }
}

