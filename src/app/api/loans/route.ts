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
    const loanIds = (data || []).map((loan) => loan.id);
    const { data: itemRows, error: itemError } = loanIds.length > 0
      ? await supabaseAdmin
        .from('loan_request_items')
        .select('loan_request_id, assets(name, code, category, location, specs)')
        .in('loan_request_id', loanIds)
      : { data: [], error: null };
    if (itemError) throw itemError;
    const loans = (data || []).map((loan) => ({
      ...loan,
      asset_items: [
        ...(loan.assets ? [loan.assets] : []),
        ...(itemRows || []).filter((item) => item.loan_request_id === loan.id).map((item) => item.assets?.[0]).filter(Boolean),
      ],
      asset_name: [
        ...(loan.assets ? [loan.assets.name] : []),
        ...(itemRows || []).filter((item) => item.loan_request_id === loan.id).map((item) => item.assets?.[0]?.name).filter(Boolean),
      ].join(' + ') || `Ruangan ${loan.room_name || ''}`.trim(),
      asset_code: [
        ...(loan.assets ? [loan.assets.code] : []),
        ...(itemRows || []).filter((item) => item.loan_request_id === loan.id).map((item) => item.assets?.[0]?.code).filter(Boolean),
      ].join(' + ') || `${loan.room_building || ''} / ${loan.room_name || ''}`.trim(),
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
      asset_ids,
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

    const isRoomLoan = Boolean(!asset_id && room_building && room_name);
    const requestedAssetIds: string[] = Array.isArray(asset_ids)
      ? [...new Set(asset_ids.filter((id): id is string => typeof id === 'string' && Boolean(id.trim())))]
      : [];
    const additionalAssetIds = isRoomLoan
      ? requestedAssetIds
      : requestedAssetIds.filter((id) => id !== asset_id);

    // Check if asset exists and is not permanently broken
    interface AssetCheck {
      id: string;
      name: string;
      category: string;
      location: string;
      specs: string | null;
      condition: string;
      status: string;
    }
    let asset: AssetCheck | null = null;
    if (!isRoomLoan) {
      const { data: selectedAsset, error: assetError } = await supabaseAdmin
        .from('assets')
        .select('id, name, category, location, specs, condition, status')
        .eq('id', asset_id)
        .maybeSingle<AssetCheck>();
      if (assetError) throw assetError;
      asset = selectedAsset;
      if (!asset) {
        return NextResponse.json({ error: 'Sarpras / Aset yang dipilih tidak ditemukan' }, { status: 404 });
      }

      const searchableText = `${asset.name} ${asset.location} ${asset.specs || ''}`.toLowerCase();
      const isLoanableAsset =
        asset.category === 'VEHICLE' ||
        asset.category === 'ROOM' ||
        (asset.category === 'ELECTRONIC' && (
          searchableText.includes('sarpras') ||
          searchableText.includes('proyektor') ||
          searchableText.includes('projector') ||
          searchableText.includes('kabel')
        ));

      if (!isLoanableAsset) {
        return NextResponse.json(
          { error: 'Aset ini merupakan inventaris ruangan dan tidak tersedia untuk peminjaman.' },
          { status: 400 }
        );
      }
    }

    if (asset && (asset.status !== 'TERSEDIA' || asset.condition === 'RUSAK_BERAT')) {
      return NextResponse.json(
        { error: `Sarpras (${asset.name}) saat ini tidak tersedia untuk dipinjam` },
        { status: 400 }
      );
    }

    interface AdditionalAsset extends AssetCheck {
      code: string;
    }
    let additionalAssets: AdditionalAsset[] = [];
    if (additionalAssetIds.length > 0) {
      const { data: selectedAssets, error: additionalError } = await supabaseAdmin
        .from('assets')
        .select('id, code, name, category, location, specs, condition, status')
        .in('id', additionalAssetIds)
        .returns<AdditionalAsset[]>();
      if (additionalError) throw additionalError;
      additionalAssets = selectedAssets || [];
      if (additionalAssets.length !== additionalAssetIds.length) {
        return NextResponse.json({ error: 'Salah satu peralatan tambahan tidak ditemukan' }, { status: 404 });
      }
      const unavailableAsset = additionalAssets.find((selected) =>
        selected.status !== 'TERSEDIA' || selected.condition === 'RUSAK_BERAT' || selected.category !== 'ELECTRONIC'
      );
      if (unavailableAsset) {
        return NextResponse.json(
          { error: `Peralatan tambahan (${unavailableAsset.name}) tidak tersedia untuk dipinjam` },
          { status: 400 }
        );
      }
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

    const conflictTargets = isRoomLoan
      ? [{ room_building, room_name: room_name.trim() }]
      : [{ asset_id }];
    const conflict = (await Promise.all(conflictTargets.map(async (target) => {
      let conflictQuery = supabaseAdmin
        .from('loan_requests')
        .select('ticket_code, start_date, start_time, end_date, end_time')
        .in('status', ['APPROVED', 'IN_USE', 'PENDING_HEAD', 'PENDING_ADMIN_UMUM']);
      conflictQuery = 'room_building' in target
        ? conflictQuery.eq('room_building', target.room_building).eq('room_name', target.room_name)
        : conflictQuery.eq('asset_id', target.asset_id);
      const { data: possibleConflicts, error: conflictError } = await conflictQuery;
      if (conflictError) throw conflictError;
      return (possibleConflicts || []).find((row) =>
        `${row.start_date} ${row.start_time}` < endIso && `${row.end_date} ${row.end_time}` > startIso
      ) as ConflictRow | undefined;
    }))).find(Boolean);

    const additionalConflict = await Promise.all(additionalAssetIds.map(async (additionalAssetId) => {
      const { data: possibleConflicts, error: conflictError } = await supabaseAdmin
        .from('loan_request_items')
        .select('loan_requests!inner(ticket_code, start_date, start_time, end_date, end_time, status)')
        .eq('asset_id', additionalAssetId)
        .in('loan_requests.status', ['APPROVED', 'IN_USE', 'PENDING_HEAD', 'PENDING_ADMIN_UMUM']);
      if (conflictError) throw conflictError;
      return (possibleConflicts || []).map((row) => row.loan_requests?.[0]).find((row) => row &&
        `${row.start_date} ${row.start_time}` < endIso && `${row.end_date} ${row.end_time}` > startIso
      ) as ConflictRow | undefined;
    })).then((conflicts) => conflicts.find(Boolean));
    const selectedConflict = conflict || additionalConflict;

    if (selectedConflict) {
      return NextResponse.json(
        {
          error: `Jadwal bentrok dengan peminjaman lain (${selectedConflict.ticket_code}) pada tanggal ${selectedConflict.start_date} ${selectedConflict.start_time} s/d ${selectedConflict.end_date} ${selectedConflict.end_time}. Silakan pilih waktu atau unit lain.`
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

    if (additionalAssetIds.length > 0) {
      const { error: itemInsertError } = await supabaseAdmin.from('loan_request_items').insert(
        additionalAssetIds.map((additionalAssetId, index) => ({
          id: `loan_item_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`,
          loan_request_id: id,
          asset_id: additionalAssetId,
          created_at: now,
        }))
      );
      if (itemInsertError) throw itemInsertError;
    }

    const { data: createdRow, error: createdError } = await supabaseAdmin
      .from('loan_requests')
      .select('*, assets(name, code, category)')
      .eq('id', id)
      .single();
    if (createdError) throw createdError;
    const { data: createdItems, error: createdItemsError } = await supabaseAdmin
      .from('loan_request_items')
      .select('assets(name, code, category, location, specs)')
      .eq('loan_request_id', id);
    if (createdItemsError) throw createdItemsError;
    const createdLoan = {
      ...createdRow,
      asset_items: [
        ...(createdRow.assets ? [createdRow.assets] : []),
        ...(createdItems || []).map((item) => item.assets?.[0]).filter(Boolean),
      ],
      asset_name: [
        ...(createdRow.assets ? [createdRow.assets.name] : []),
        ...(createdItems || []).map((item) => item.assets?.[0]?.name).filter(Boolean),
      ].join(' + ') || `Ruangan ${createdRow.room_name || ''}`.trim(),
      asset_code: [
        ...(createdRow.assets ? [createdRow.assets.code] : []),
        ...(createdItems || []).map((item) => item.assets?.[0]?.code).filter(Boolean),
      ].join(' + ') || `${createdRow.room_building || ''} / ${createdRow.room_name || ''}`.trim(),
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

