// app/api/exit/scan/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/naga_smart_park",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticket_id } = body;

    if (!ticket_id) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required.' }, { status: 400 });
    }

    const query = `
      SELECT 
        s.id AS session_id,
        s.ticket_id,
        s.time_in,
        sp.spot_number,
        sp.vehicle_type,
        r.initial_fee,
        r.initial_duration_mins,
        r.additional_increment_mins,
        r.additional_rate
      FROM sessions s
      JOIN spots sp ON s.spot_id = sp.id
      JOIN rates r ON s.rate_id = r.id
      WHERE s.ticket_id = $1 AND s.status = 'active'
      LIMIT 1;
    `;

    const res = await pool.query(query, [ticket_id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Active session not found for this ticket ID.' }, { status: 404 });
    }

    const row = res.rows[0];

    const timeIn = new Date(row.time_in);
    const now = new Date();
    const diffMs = now.getTime() - timeIn.getTime();
    const duration_mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));

    let amount_due = parseFloat(row.initial_fee);
    if (duration_mins > row.initial_duration_mins) {
      const extraMins = duration_mins - row.initial_duration_mins;
      const increments = Math.ceil(extraMins / row.additional_increment_mins);
      amount_due += increments * parseFloat(row.additional_rate);
    }

    return NextResponse.json({
      success: true,
      session_id: row.session_id,
      ticket_id: row.ticket_id,
      spot_number: row.spot_number,
      vehicle_type: row.vehicle_type,
      duration_mins,
      amount_due: amount_due.toFixed(2),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}