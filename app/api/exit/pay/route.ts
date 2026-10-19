// app/api/exit/pay/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/naga_smart_park",
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { session_id, amount_due, amount_paid, payment_method, attendant_name } = body;

    if (!session_id || amount_paid === undefined || amount_paid < amount_due) {
      return NextResponse.json({ success: false, error: 'Invalid payment details or insufficient amount.' }, { status: 400 });
    }

    const change_amount = Number((amount_paid - amount_due).toFixed(2));
    const transaction_id = 'TXN-' + Date.now();

    await client.query('BEGIN');

    // 1. Fetch session to find spot_id
    const sessionRes = await client.query('SELECT spot_id FROM sessions WHERE id = $1', [session_id]);
    if (sessionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Active session not found.' }, { status: 404 });
    }
    const spotId = sessionRes.rows[0].spot_id;

    // 2. Insert transaction record
    await client.query(
      `INSERT INTO transactions (session_id, transaction_id, amount_due, amount_paid, change_amount, payment_method, attendant_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [session_id, transaction_id, amount_due, amount_paid, change_amount, payment_method || 'Cash', attendant_name || 'System']
    );

    // 3. Close session
    await client.query(
      `UPDATE sessions SET status = 'completed', time_out = CURRENT_TIMESTAMP WHERE id = $1`,
      [session_id]
    );

    // 4. Free up the parking spot status
    await client.query(
      `UPDATE spots SET status = 'available' WHERE id = $1`,
      [spotId]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      transaction_id,
      change: change_amount,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}