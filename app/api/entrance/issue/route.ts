// app/api/entrance/issue/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/naga_smart_park",
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { vehicle_type } = body;

    if (!vehicle_type) {
      return NextResponse.json({ success: false, error: 'Vehicle type is required.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Find an available spot for this vehicle type
    const spotRes = await client.query(
      `SELECT id, spot_number FROM spots WHERE vehicle_type = $1 AND status = 'available' LIMIT 1 FOR UPDATE`,
      [vehicle_type]
    );

    if (spotRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Parking full for this vehicle category.' }, { status: 400 });
    }

    const spot = spotRes.rows[0];

    // 2. Get rates for this vehicle category
    const rateRes = await client.query(
      `SELECT id FROM rates WHERE vehicle_category = $1 LIMIT 1`,
      [vehicle_type]
    );

    if (rateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Rate configuration not found for this vehicle category.' }, { status: 400 });
    }

    const rateId = rateRes.rows[0].id;

    // 3. Generate ticket and QR code
    const ticket_id = 'TKT-' + Date.now();
    const qr_code = 'QR-' + ticket_id;

    // 4. Create active session
    const sessionRes = await client.query(
      `INSERT INTO sessions (spot_id, rate_id, ticket_id, qr_code, status) VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      [spot.id, rateId, ticket_id, qr_code]
    );

    // 5. Update spot status to occupied
    await client.query(
      `UPDATE spots SET status = 'occupied' WHERE id = $1`,
      [spot.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      ticket: {
        ticket_id,
        qr_code,
      },
      spot_number: spot.spot_number,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}