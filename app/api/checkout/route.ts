// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get('ticket_id');

  if (!ticketId || ticketId === 'undefined') {
    return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
  }

  try {
    const query = `
      SELECT s.*, r.vehicle_category, r.initial_fee, r.initial_duration_mins, r.additional_increment_mins, r.additional_rate
      FROM sessions s
      JOIN rates r ON s.rate_id = r.id
      WHERE (s.ticket_id = $1 OR s.qr_code = $1) AND s.status = 'active'
    `;
    const result = await pool.query(query, [ticketId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Active ticket not found' }, { status: 404 });
    }

    const session = result.rows[0];
    const timeIn = new Date(session.time_in);
    const timeOut = new Date();
    const durationMins = Math.max(1, Math.ceil((timeOut.getTime() - timeIn.getTime()) / (1000 * 60)));

    let amountDue = parseFloat(session.initial_fee);
    if (durationMins > session.initial_duration_mins) {
      const extraMins = durationMins - session.initial_duration_mins;
      const increments = Math.ceil(extraMins / session.additional_increment_mins);
      amountDue += increments * parseFloat(session.additional_rate);
    }

    return NextResponse.json({
      ...session,
      duration_mins: durationMins,
      amount_due: amountDue.toFixed(2),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { session_id, amount_paid, payment_method, attendant_name } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const sessionQuery = `
      SELECT s.*, r.initial_fee, r.initial_duration_mins, r.additional_increment_mins, r.additional_rate
      FROM sessions s
      JOIN rates r ON s.rate_id = r.id
      WHERE s.id = $1 AND s.status = 'active'
    `;
    const sessionResult = await pool.query(sessionQuery, [session_id]);

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Active session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];
    const timeIn = new Date(session.time_in);
    const timeOut = new Date();
    const diffMins = Math.max(1, Math.ceil((timeOut.getTime() - timeIn.getTime()) / (1000 * 60)));

    let amountDue = parseFloat(session.initial_fee);
    if (diffMins > session.initial_duration_mins) {
      const extraMins = diffMins - session.initial_duration_mins;
      const increments = Math.ceil(extraMins / session.additional_increment_mins);
      amountDue += increments * parseFloat(session.additional_rate);
    }

    const paid = parseFloat(amount_paid || amountDue);
    const change = Math.max(0, paid - amountDue);
    const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE sessions SET time_out = CURRENT_TIMESTAMP, status = 'completed' WHERE id = $1`,
        [session.id]
      );

      await client.query(
        `UPDATE spots SET status = 'available' WHERE id = $1`,
        [session.spot_id]
      );

      const txResult = await client.query(
        `INSERT INTO transactions (session_id, transaction_id, amount_due, amount_paid, change_amount, payment_method, attendant_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [session.id, transactionId, amountDue, paid, change, payment_method || 'Cash', attendant_name || 'System Admin']
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        transaction: txResult.rows[0],
        amount_due: amountDue,
        change_amount: change.toFixed(2),
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}